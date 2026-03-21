async function blobToImage(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Unable to load image.'));
      element.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const MAX_OUTPUT_BYTES = 1_900_000;
const MAX_DIMENSION = 1280;
const MIN_QUALITY = 0.45;

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to compress image.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

export async function resizeAndCompress(file: Blob) {
  const image = await blobToImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to process image.');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let compressedBlob = await canvasToBlob(canvas, quality);

  while (compressedBlob.size > MAX_OUTPUT_BYTES && quality > MIN_QUALITY) {
    quality -= 0.08;
    compressedBlob = await canvasToBlob(canvas, quality);
  }

  if (compressedBlob.size <= MAX_OUTPUT_BYTES) {
    return compressedBlob;
  }

  let nextWidth = canvas.width;
  let nextHeight = canvas.height;
  let resizedBlob = compressedBlob;

  while (resizedBlob.size > MAX_OUTPUT_BYTES && nextWidth > 640 && nextHeight > 640) {
    nextWidth = Math.max(640, Math.round(nextWidth * 0.85));
    nextHeight = Math.max(640, Math.round(nextHeight * 0.85));

    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = nextWidth;
    resizedCanvas.height = nextHeight;

    const resizedContext = resizedCanvas.getContext('2d');

    if (!resizedContext) {
      throw new Error('Unable to process image.');
    }

    resizedContext.drawImage(image, 0, 0, resizedCanvas.width, resizedCanvas.height);
    resizedBlob = await canvasToBlob(resizedCanvas, Math.max(MIN_QUALITY, quality));
  }

  if (resizedBlob.size > MAX_OUTPUT_BYTES) {
    throw new Error('Image is still too large after compression.');
  }

  return resizedBlob;
}
