import cron from 'node-cron';
import PocketBase from 'pocketbase';
import webpush from 'web-push';

const pocketbase = new PocketBase(process.env.PB_URL || 'http://scraps-db:8090');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeFilterValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getRelationId(value) {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) return value[0];
  return null;
}

/**
 * Returns the local hour (0–23) for the given IANA timezone at `now`.
 * Falls back to UTC if the timezone string is missing or invalid.
 */
function getLocalHour(timezoneName, now) {
  try {
    const tz = timezoneName && timezoneName.length > 0 ? timezoneName : 'UTC';
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).format(now);
    const h = Number(formatted.replace(/^0/, ''));
    return Number.isFinite(h) ? h : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

/**
 * Returns true when the subscription's preferred notify_hour matches the
 * current local hour in the subscription's timezone.
 */
function isInNotifyWindow(subscription, now) {
  const notifyHour = typeof subscription.notify_hour === 'number' ? subscription.notify_hour : 12;
  return getLocalHour(subscription.notify_timezone, now) === notifyHour;
}

function buildExpiringFilter(now, cutoff) {
  return [
    "status = 'active'",
    `expiry_date > '${escapeFilterValue(now.toISOString())}'`,
    `expiry_date <= '${escapeFilterValue(cutoff.toISOString())}'`,
    "notified_at = ''",
  ].join(' && ');
}

function buildNotificationPayload(leftover) {
  return JSON.stringify({
    body: `${leftover.item_name} expires within 24 hours. Use it or lose it.`,
    itemId: leftover.id,
    title: 'Scraps reminder',
    url: '/',
  });
}

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

async function authenticateAdmin() {
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('Notifier is running without PocketBase admin credentials. Expiry checks are skipped.');
    return false;
  }

  await pocketbase.collection('_superusers').authWithPassword(email, password);
  return true;
}

async function listExpiringLeftovers(now, cutoff) {
  return pocketbase.collection('leftovers').getFullList({
    fields: 'id,item_name,expiry_date,household_id,category',
    filter: buildExpiringFilter(now, cutoff),
    sort: '+expiry_date',
  });
}

/** Fetch ALL subscriptions that have notifications enabled. */
async function listAllEnabledSubscriptions() {
  return pocketbase.collection('push_subscriptions').getFullList({
    fields: 'id,household_id,endpoint,p256dh,auth_key,notifications_enabled,notify_expiring_leftovers,notify_meat,notify_poultry,notify_seafood,notify_veg,notify_dairy,notify_grains,notify_prepared,notify_other,notify_hour,notify_timezone',
    filter: "notifications_enabled = true",
  });
}

function shouldNotifySubscription(subscriptionRecord, leftover) {
  if (subscriptionRecord.notifications_enabled === false) {
    return false;
  }

  if (subscriptionRecord.notify_expiring_leftovers === false) {
    return false;
  }

  const categoryKey = `notify_${leftover.category}`;
  return subscriptionRecord[categoryKey] !== false;
}

async function deleteSubscription(subscriptionId) {
  try {
    await pocketbase.collection('push_subscriptions').delete(subscriptionId);
  } catch (error) {
    console.warn('Failed to delete stale push subscription', subscriptionId, error);
  }
}

async function sendNotification(subscriptionRecord, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscriptionRecord.endpoint,
        keys: {
          auth: subscriptionRecord.auth_key,
          p256dh: subscriptionRecord.p256dh,
        },
      },
      payload,
    );

    return true;
  } catch (error) {
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : null;

    if (statusCode === 404 || statusCode === 410) {
      await deleteSubscription(subscriptionRecord.id);
      return false;
    }

    console.warn('Failed to send push notification', subscriptionRecord.id, error);
    return false;
  }
}

async function markLeftoverNotified(leftoverId) {
  await pocketbase.collection('leftovers').update(leftoverId, {
    notified_at: new Date().toISOString(),
  });
}

// ─── Main check logic ─────────────────────────────────────────────────────────

async function runExpiryCheck() {
  if (!await authenticateAdmin()) return;

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.warn('Notifier is missing VAPID configuration. Expiry checks are skipped.');
    return;
  }

  const now = new Date();

  // 1. Find which subscriptions should fire NOW (local hour matches notify_hour).
  const allSubscriptions = await listAllEnabledSubscriptions();
  const qualifying = allSubscriptions.filter((sub) => isInNotifyWindow(sub, now));

  if (qualifying.length === 0) {
    // Nothing scheduled for this half-hour window — exit silently.
    return;
  }

  // 2. Group qualifying subscriptions by household.
  const householdSubs = new Map();

  for (const sub of qualifying) {
    const hid = getRelationId(sub.household_id);
    if (!hid) continue;
    const list = householdSubs.get(hid) ?? [];
    list.push(sub);
    householdSubs.set(hid, list);
  }

  if (householdSubs.size === 0) return;

  // 3. Fetch leftovers expiring in the next 24 h.
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const leftovers = await listExpiringLeftovers(now, cutoff);

  if (leftovers.length === 0) {
    console.info('Notifier: no leftovers expiring within 24 h at this time.');
    return;
  }

  // Group leftovers by household for O(1) lookup.
  const leftoversByHousehold = new Map();

  for (const lft of leftovers) {
    const hid = getRelationId(lft.household_id);
    if (!hid) continue;
    const list = leftoversByHousehold.get(hid) ?? [];
    list.push(lft);
    leftoversByHousehold.set(hid, list);
  }

  let notificationCount = 0;
  let notifiedItemCount = 0;

  // 4. Notify qualifying subscriptions per household.
  for (const [householdId, subs] of householdSubs.entries()) {
    const householdLeftovers = leftoversByHousehold.get(householdId) ?? [];

    for (const leftover of householdLeftovers) {
      const payload = buildNotificationPayload(leftover);
      let delivered = false;

      for (const sub of subs) {
        if (!shouldNotifySubscription(sub, leftover)) continue;
        const sent = await sendNotification(sub, payload);
        delivered = delivered || sent;
        if (sent) notificationCount += 1;
      }

      if (delivered) {
        await markLeftoverNotified(leftover.id);
        notifiedItemCount += 1;
      }
    }
  }

  console.info(
    `Notifier: sent ${notificationCount} notifications across ${notifiedItemCount} leftovers.`,
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
// Runs every 30 minutes. The per-subscription isInNotifyWindow() filter ensures
// only subscriptions whose preferred local hour matches NOW are processed,
// giving up to 30-minute precision for the user-chosen notification time.
cron.schedule('*/30 * * * *', () => {
  void runExpiryCheck();
});

// Run once on startup to catch the current window if the container just restarted.
void runExpiryCheck();
