migrate(
  (app) => {
    const leftovers = app.findCollectionByNameOrId('leftovers');
    const photoField = leftovers.fields.getByName('photo');

    photoField.mimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'image/avif',
    ];

    app.save(leftovers);
  },
  (app) => {
    const leftovers = app.findCollectionByNameOrId('leftovers');
    const photoField = leftovers.fields.getByName('photo');

    photoField.mimeTypes = ['image/*'];

    app.save(leftovers);
  },
);