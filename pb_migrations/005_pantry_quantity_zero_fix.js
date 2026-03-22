migrate(
  (app) => {
    const pantryItems = app.findCollectionByNameOrId('pantry_items');
    const quantityField = pantryItems.fields.getByName('quantity');

    quantityField.required = false;
    quantityField.min = 0;

    app.save(pantryItems);
  },
  (app) => {
    const pantryItems = app.findCollectionByNameOrId('pantry_items');
    const quantityField = pantryItems.fields.getByName('quantity');

    quantityField.required = true;
    quantityField.min = 0;

    app.save(pantryItems);
  },
);