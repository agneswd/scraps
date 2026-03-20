migrate(
  (app) => {
    const households = new Collection({
      name: 'households',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'household_name',
          name: 'name',
          type: 'text',
          required: true,
          presentable: true,
          unique: false,
          options: {
            min: null,
            max: null,
            pattern: '',
          },
        },
      ],
      listRule: '@request.auth != ""',
      viewRule: '@request.auth != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });

    app.save(households);

    const leftovers = new Collection({
      name: 'leftovers',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'household_relation',
          name: 'household_id',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: households.id,
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
            displayFields: []
          }
        },
        {
          system: false,
          id: 'added_by_relation',
          name: 'added_by',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
            displayFields: []
          }
        },
        {
          system: false,
          id: 'item_name_text',
          name: 'item_name',
          type: 'text',
          required: true,
          presentable: true,
          unique: false,
          options: {
            min: 1,
            max: null,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'category_select',
          name: 'category',
          type: 'select',
          required: true,
          presentable: false,
          unique: false,
          options: {
            maxSelect: 1,
            values: ['meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other']
          }
        },
        {
          system: false,
          id: 'expiry_date_field',
          name: 'expiry_date',
          type: 'date',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: '',
            max: ''
          }
        },
        {
          system: false,
          id: 'status_select',
          name: 'status',
          type: 'select',
          required: true,
          presentable: false,
          unique: false,
          options: {
            maxSelect: 1,
            values: ['active', 'consumed', 'wasted']
          }
        },
        {
          system: false,
          id: 'photo_file',
          name: 'photo',
          type: 'file',
          required: false,
          presentable: false,
          unique: false,
          options: {
            maxSelect: 1,
            maxSize: 2097152,
            mimeTypes: ['image/*'],
            thumbs: []
          }
        },
        {
          system: false,
          id: 'notes_text',
          name: 'notes',
          type: 'text',
          required: false,
          presentable: false,
          unique: false,
          options: {
            min: null,
            max: 60,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'notified_at_date',
          name: 'notified_at',
          type: 'date',
          required: false,
          presentable: false,
          unique: false,
          options: {
            min: '',
            max: ''
          }
        }
      ],
      listRule: '@request.auth.household_id = household_id',
      viewRule: '@request.auth.household_id = household_id',
      createRule: '@request.auth.household_id = @request.data.household_id',
      updateRule: '@request.auth.household_id = household_id',
      deleteRule: '@request.auth.household_id = household_id'
    });

    app.save(leftovers);

    const pushSubscriptions = new Collection({
      name: 'push_subscriptions',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'push_user_relation',
          name: 'user_id',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
            displayFields: []
          }
        },
        {
          system: false,
          id: 'push_household_relation',
          name: 'household_id',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: households.id,
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
            displayFields: []
          }
        },
        {
          system: false,
          id: 'push_endpoint',
          name: 'endpoint',
          type: 'text',
          required: true,
          presentable: false,
          unique: true,
          options: {
            min: 1,
            max: null,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'push_p256dh',
          name: 'p256dh',
          type: 'text',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 1,
            max: null,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'push_auth_key',
          name: 'auth_key',
          type: 'text',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 1,
            max: null,
            pattern: ''
          }
        }
      ],
      listRule: '@request.auth.id = user_id',
      viewRule: '@request.auth.id = user_id',
      createRule: '@request.auth.id = @request.data.user_id',
      updateRule: null,
      deleteRule: '@request.auth.id = user_id'
    });

    app.save(pushSubscriptions);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('push_subscriptions'));
    app.delete(app.findCollectionByNameOrId('leftovers'));
    app.delete(app.findCollectionByNameOrId('households'));
  },
);
