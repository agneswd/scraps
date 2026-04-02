/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const pushSubscriptions = app.findCollectionByNameOrId('push_subscriptions');

    pushSubscriptions.fields.add(
      // 0–23 representing the local hour at which the daily reminder fires.
      // Default 12 = noon. Stored as a plain number; the notifier interprets it
      // together with notify_timezone to determine UTC schedule per subscription.
      new NumberField({ name: 'notify_hour', required: false, min: 0, max: 23 }),
      // IANA timezone string (e.g. "Europe/Berlin"). Auto-detected by the browser
      // on first subscription. Empty string falls back to UTC inside the notifier.
      new TextField({ name: 'notify_timezone', required: false }),
    );

    app.save(pushSubscriptions);
  },
  (app) => {
    const pushSubscriptions = app.findCollectionByNameOrId('push_subscriptions');

    pushSubscriptions.fields.removeByName('notify_hour');
    pushSubscriptions.fields.removeByName('notify_timezone');

    app.save(pushSubscriptions);
  },
);
