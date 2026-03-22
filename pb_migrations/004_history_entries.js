migrate(
  (app) => {
    const households = app.findCollectionByNameOrId('households');

    const historyEntries = new Collection({
      name: 'history_entries',
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
          type: 'select',
          name: 'entity_type',
          required: true,
          maxSelect: 1,
          values: ['leftover', 'pantry_item', 'recipe', 'shopping_item'],
        },
        {
          type: 'select',
          name: 'action',
          required: true,
          maxSelect: 1,
          values: ['deleted'],
        },
        {
          type: 'text',
          name: 'title',
          required: true,
          min: 1,
        },
        {
          type: 'text',
          name: 'category',
          required: false,
        },
        {
          type: 'text',
          name: 'snapshot_json',
          required: true,
          min: 2,
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_history_household ON history_entries (household_id)',
        'CREATE INDEX idx_history_entity_type ON history_entries (entity_type)',
      ],
    });

    app.save(historyEntries);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('history_entries'));
  },
);