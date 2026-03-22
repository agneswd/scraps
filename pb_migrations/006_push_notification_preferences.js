migrate(
  (app) => {
    const pushSubscriptions = app.findCollectionByNameOrId('push_subscriptions');

    pushSubscriptions.updateRule = '@request.auth.id ?= user_id';
    pushSubscriptions.fields.add(
      new BoolField({ name: 'notifications_enabled', required: false }),
      new BoolField({ name: 'notify_expiring_leftovers', required: false }),
      new BoolField({ name: 'notify_meat', required: false }),
      new BoolField({ name: 'notify_poultry', required: false }),
      new BoolField({ name: 'notify_seafood', required: false }),
      new BoolField({ name: 'notify_veg', required: false }),
      new BoolField({ name: 'notify_dairy', required: false }),
      new BoolField({ name: 'notify_grains', required: false }),
      new BoolField({ name: 'notify_prepared', required: false }),
      new BoolField({ name: 'notify_other', required: false }),
    );

    app.save(pushSubscriptions);
  },
  (app) => {
    const pushSubscriptions = app.findCollectionByNameOrId('push_subscriptions');

    pushSubscriptions.updateRule = null;
    pushSubscriptions.fields.removeByName('notifications_enabled');
    pushSubscriptions.fields.removeByName('notify_expiring_leftovers');
    pushSubscriptions.fields.removeByName('notify_meat');
    pushSubscriptions.fields.removeByName('notify_poultry');
    pushSubscriptions.fields.removeByName('notify_seafood');
    pushSubscriptions.fields.removeByName('notify_veg');
    pushSubscriptions.fields.removeByName('notify_dairy');
    pushSubscriptions.fields.removeByName('notify_grains');
    pushSubscriptions.fields.removeByName('notify_prepared');
    pushSubscriptions.fields.removeByName('notify_other');

    app.save(pushSubscriptions);
  },
);