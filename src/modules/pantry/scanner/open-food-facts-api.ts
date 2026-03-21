import type { PantryCategory } from '@/modules/pantry/pantry-categories';
import { resizeAndCompress } from '@/modules/add-item/image-utils';

const OFF_LOCALE_MAP: Record<string, string> = {
  en: 'world',
  sv: 'se',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  ru: 'ru',
};

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    categories_tags?: string[];
    image_front_url?: string;
    quantity?: string;
  };
};

export type OpenFoodFactsProduct = {
  barcode: string;
  name: string;
  brand?: string;
  category: PantryCategory;
  quantityLabel?: string;
  imageUrl?: string;
  imageBlob?: Blob | null;
};

function resolveLocale(language: string) {
  const normalized = language.toLowerCase();
  const base = normalized.split('-')[0] ?? 'en';
  return OFF_LOCALE_MAP[normalized] ?? OFF_LOCALE_MAP[base] ?? 'world';
}

function inferPantryCategory(tags: string[] = []): PantryCategory {
  const haystack = tags.join(' ').toLowerCase();

  const categoryMatchers: Array<{ category: PantryCategory; terms: string[] }> = [
    { category: 'seafood', terms: ['fish', 'seafood', 'salmon', 'tuna', 'shrimp'] },
    { category: 'poultry', terms: ['chicken', 'poultry', 'turkey', 'duck'] },
    { category: 'meat', terms: ['meat', 'beef', 'pork', 'sausage', 'ham'] },
    { category: 'dairy', terms: ['milk', 'yogurt', 'yoghurt', 'cheese', 'butter', 'cream'] },
    { category: 'grains', terms: ['rice', 'pasta', 'grain', 'bread', 'cereal', 'oat', 'flour'] },
    { category: 'veg', terms: ['vegetable', 'tomato', 'beans', 'lentil', 'pea', 'corn'] },
    { category: 'condiment', terms: ['sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'vinegar'] },
    { category: 'spice', terms: ['spice', 'seasoning', 'herb', 'pepper', 'paprika', 'curry'] },
    { category: 'beverage', terms: ['juice', 'drink', 'soda', 'water', 'coffee', 'tea'] },
    { category: 'frozen', terms: ['frozen'] },
    { category: 'baking', terms: ['baking', 'sugar', 'cake', 'mix'] },
    { category: 'canned', terms: ['canned', 'can', 'tin'] },
    { category: 'prepared', terms: ['prepared', 'ready-meal', 'soup', 'meal'] },
  ];

  for (const matcher of categoryMatchers) {
    if (matcher.terms.some((term) => haystack.includes(term))) {
      return matcher.category;
    }
  }

  return 'other';
}

async function fetchImageBlob(imageUrl?: string) {
  if (!imageUrl) {
    return null;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return blob.type.startsWith('image/') ? resizeAndCompress(blob) : blob;
  } catch {
    return null;
  }
}

export async function lookupOpenFoodFactsProduct(barcode: string, language: string) {
  const locale = resolveLocale(language);
  const url = new URL(`https://${locale}.openfoodfacts.org/api/v2/product/${barcode}.json`);
  url.searchParams.set('fields', 'product_name,product_name_en,brands,categories_tags,image_front_url,quantity');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('open-food-facts-request-failed');
  }

  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) {
    return null;
  }

  const name = data.product.product_name?.trim() || data.product.product_name_en?.trim();
  if (!name) {
    return null;
  }

  const imageBlob = await fetchImageBlob(data.product.image_front_url);

  return {
    barcode,
    name,
    brand: data.product.brands?.trim() || undefined,
    category: inferPantryCategory(data.product.categories_tags),
    quantityLabel: data.product.quantity?.trim() || undefined,
    imageUrl: data.product.image_front_url,
    imageBlob,
  } satisfies OpenFoodFactsProduct;
}
