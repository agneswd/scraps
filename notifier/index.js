import cron from 'node-cron';
import PocketBase from 'pocketbase';
import webpush from 'web-push';

const pocketbase = new PocketBase(process.env.PB_URL || 'http://scraps-db:8090');
const checkIntervalHours = Math.max(1, Number(process.env.CHECK_INTERVAL_HOURS || 2));

function escapeFilterValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getRelationId(value) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) {
    return value[0];
  }

  return null;
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
    fields: 'id,item_name,expiry_date,household_id',
    filter: buildExpiringFilter(now, cutoff),
    sort: '+expiry_date',
  });
}

async function listHouseholdSubscriptions(householdId) {
  return pocketbase.collection('push_subscriptions').getFullList({
    fields: 'id,endpoint,p256dh,auth_key',
    filter: `household_id = '${escapeFilterValue(householdId)}'`,
  });
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

async function runExpiryCheck() {
  const isAuthenticated = await authenticateAdmin();

  if (!isAuthenticated) {
    return;
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.warn('Notifier is missing VAPID configuration. Expiry checks are skipped.');
    return;
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const leftovers = await listExpiringLeftovers(now, cutoff);

  if (leftovers.length === 0) {
    console.info('Notifier check complete. No leftovers are expiring within 24 hours.');
    return;
  }

  const leftoversByHousehold = new Map();

  for (const leftover of leftovers) {
    const householdId = getRelationId(leftover.household_id);

    if (!householdId) {
      continue;
    }

    const householdLeftovers = leftoversByHousehold.get(householdId) ?? [];
    householdLeftovers.push(leftover);
    leftoversByHousehold.set(householdId, householdLeftovers);
  }

  let notificationCount = 0;
  let notifiedItemCount = 0;

  for (const [householdId, householdLeftovers] of leftoversByHousehold.entries()) {
    const subscriptions = await listHouseholdSubscriptions(householdId);

    if (subscriptions.length === 0) {
      continue;
    }

    for (const leftover of householdLeftovers) {
      const payload = buildNotificationPayload(leftover);
      let delivered = false;

      for (const subscription of subscriptions) {
        const sent = await sendNotification(subscription, payload);
        delivered = delivered || sent;

        if (sent) {
          notificationCount += 1;
        }
      }

      if (delivered) {
        await markLeftoverNotified(leftover.id);
        notifiedItemCount += 1;
      }
    }
  }

  console.info(
    `Notifier check complete. Sent ${notificationCount} notifications across ${notifiedItemCount} leftovers.`,
  );
}

cron.schedule(`0 */${checkIntervalHours} * * *`, () => {
  void runExpiryCheck();
});

void runExpiryCheck();
