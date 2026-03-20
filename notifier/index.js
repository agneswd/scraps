import cron from 'node-cron';
import PocketBase from 'pocketbase';
import webpush from 'web-push';

const pocketbase = new PocketBase(process.env.PB_URL || 'http://scraps-db:8090');
const checkIntervalHours = Number(process.env.CHECK_INTERVAL_HOURS || 2);

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

async function runExpiryCheck() {
  const isAuthenticated = await authenticateAdmin();

  if (!isAuthenticated) {
    return;
  }

  console.info('Notifier scaffold is online. Expiry query and push dispatch will be implemented in the push-notifications phase.');
}

cron.schedule(`0 */${checkIntervalHours} * * *`, () => {
  void runExpiryCheck();
});

void runExpiryCheck();
