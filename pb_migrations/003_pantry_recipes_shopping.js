migrate(
  (app) => {
    const households = app.findCollectionByNameOrId('households');
    const usersCollection = app.findCollectionByNameOrId('users');

    // ── pantry_items ──
    const pantryItems = new Collection({
      name: 'pantry_items',
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
          name: 'name',
          required: true,
          presentable: true,
          min: 1,
        },
        {
          type: 'text',
          name: 'barcode',
          required: false,
        },
        {
          type: 'select',
          name: 'category',
          required: true,
          maxSelect: 1,
          values: [
            'meat', 'poultry', 'seafood', 'veg', 'dairy', 'grains', 'prepared', 'other',
            'condiment', 'spice', 'beverage', 'frozen', 'baking', 'canned',
          ],
        },
        {
          type: 'number',
          name: 'quantity',
          required: true,
          min: 0,
        },
        {
          type: 'text',
          name: 'unit',
          required: false,
          max: 20,
        },
        {
          type: 'date',
          name: 'expiry_date',
          required: false,
        },
        {
          type: 'file',
          name: 'photo',
          required: false,
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['in_stock', 'low', 'finished'],
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pantry_household ON pantry_items (household_id)',
        'CREATE INDEX idx_pantry_barcode ON pantry_items (barcode)',
      ],
    });

    app.save(pantryItems);

    // ── recipes ──
    const recipes = new Collection({
      name: 'recipes',
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
          name: 'created_by',
          required: true,
          maxSelect: 1,
          collectionId: usersCollection.id,
          cascadeDelete: false,
        },
        {
          type: 'text',
          name: 'title',
          required: true,
          presentable: true,
          min: 1,
        },
        {
          type: 'text',
          name: 'description',
          required: false,
          max: 500,
        },
        {
          type: 'text',
          name: 'instructions',
          required: true,
        },
        {
          type: 'number',
          name: 'servings',
          required: false,
          min: 1,
        },
        {
          type: 'number',
          name: 'prep_time',
          required: false,
          min: 0,
        },
        {
          type: 'number',
          name: 'cook_time',
          required: false,
          min: 0,
        },
        {
          type: 'file',
          name: 'photo',
          required: false,
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          type: 'text',
          name: 'source_url',
          required: false,
        },
        {
          type: 'text',
          name: 'tags',
          required: false,
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_recipes_household ON recipes (household_id)',
      ],
    });

    app.save(recipes);

    // ── recipe_ingredients ──
    const recipeIngredients = new Collection({
      name: 'recipe_ingredients',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      fields: [
        {
          type: 'relation',
          name: 'recipe_id',
          required: true,
          maxSelect: 1,
          collectionId: recipes.id,
          cascadeDelete: true,
        },
        {
          type: 'text',
          name: 'name',
          required: true,
          min: 1,
        },
        {
          type: 'text',
          name: 'name_normalized',
          required: true,
          min: 1,
        },
        {
          type: 'number',
          name: 'quantity',
          required: false,
          min: 0,
        },
        {
          type: 'text',
          name: 'unit',
          required: false,
          max: 20,
        },
        {
          type: 'bool',
          name: 'optional',
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe_id)',
      ],
    });

    app.save(recipeIngredients);

    // ── shopping_list_items ──
    const shoppingListItems = new Collection({
      name: 'shopping_list_items',
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
          name: 'name',
          required: true,
          min: 1,
        },
        {
          type: 'number',
          name: 'quantity',
          required: false,
          min: 0,
        },
        {
          type: 'text',
          name: 'unit',
          required: false,
          max: 20,
        },
        {
          type: 'relation',
          name: 'recipe_id',
          required: false,
          maxSelect: 1,
          collectionId: recipes.id,
          cascadeDelete: false,
        },
        {
          type: 'bool',
          name: 'checked',
        },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_shopping_household ON shopping_list_items (household_id)',
      ],
    });

    app.save(shoppingListItems);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('shopping_list_items'));
    app.delete(app.findCollectionByNameOrId('recipe_ingredients'));
    app.delete(app.findCollectionByNameOrId('recipes'));
    app.delete(app.findCollectionByNameOrId('pantry_items'));
  },
);
