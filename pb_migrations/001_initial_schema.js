migrate(
  (app) => {
    const households = new Collection({
      name: 'households',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'text',
          name: 'name',
          required: true,
          presentable: true,
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
    });

    app.save(households);

    // Add household_id relation field to the built-in users collection
    const usersCollection = app.findCollectionByNameOrId('users');
    usersCollection.fields.add(new RelationField({
      name: 'household_id',
      required: true,
      maxSelect: 1,
      collectionId: households.id,
      cascadeDelete: false,
    }));
    app.save(usersCollection);

    const leftovers = new Collection({
      name: 'leftovers',
      type: 'base',
      listRule: '@request.auth.household_id ?= household_id',
      viewRule: '@request.auth.household_id ?= household_id',
      createRule: '@request.auth.household_id ?= @request.body.household_id',
      updateRule: '@request.auth.household_id ?= household_id',
      deleteRule: '@request.auth.household_id ?= household_id',
      fields: [
        {
          type: 'relation',
          name: 'household_id',
          required: true,
          maxSelect: 1,
          collectionId: households.id,
          cascadeDelete: false,
        },
        {
          type: 'relation',
          name: 'added_by',
          required: true,
          maxSelect: 1,
          collectionId: usersCollection.id,
          cascadeDelete: false,
        },
        {
          type: 'text',
          name: 'item_name',
          required: true,
          presentable: true,
          min: 1,
        },
        {
          type: 'select',
          name: 'category',
          required: true,
          maxSelect: 1,
          values: ['meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other'],
        },
        {
          type: 'date',
          name: 'expiry_date',
          required: true,
        },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['active', 'consumed', 'wasted'],
        },
        {
          type: 'file',
          name: 'photo',
          required: false,
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/*'],
        },
        {
          type: 'text',
          name: 'notes',
          required: false,
          max: 60,
        },
        {
          type: 'date',
          name: 'notified_at',
          required: false,
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
    });

    app.save(leftovers);

    const pushSubscriptions = new Collection({
      name: 'push_subscriptions',
      type: 'base',
      listRule: '@request.auth.id ?= user_id',
      viewRule: '@request.auth.id ?= user_id',
      createRule: '@request.auth.id ?= @request.body.user_id',
      updateRule: null,
      deleteRule: '@request.auth.id ?= user_id',
      fields: [
        {
          type: 'relation',
          name: 'user_id',
          required: true,
          maxSelect: 1,
          collectionId: usersCollection.id,
          cascadeDelete: true,
        },
        {
          type: 'relation',
          name: 'household_id',
          required: true,
          maxSelect: 1,
          collectionId: households.id,
          cascadeDelete: true,
        },
        {
          type: 'text',
          name: 'endpoint',
          required: true,
          min: 1,
        },
        {
          type: 'text',
          name: 'p256dh',
          required: true,
          min: 1,
        },
        {
          type: 'text',
          name: 'auth_key',
          required: true,
          min: 1,
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_push_endpoint ON push_subscriptions (endpoint)',
      ],
    });

    app.save(pushSubscriptions);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('push_subscriptions'));
    app.delete(app.findCollectionByNameOrId('leftovers'));
    app.delete(app.findCollectionByNameOrId('households'));
  },
);
