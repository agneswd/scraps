import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';
import type { PantryCategory } from '@/modules/pantry/pantry-categories';
import type { RecipeIngredientInput } from '@/modules/pantry/recipes/data/recipe-api';
import { GEMINI_DAILY_LIMIT, incrementDailyUsage, isDailyLimitReached } from '@/modules/ai/rate-limits';

const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY?.trim();
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export type AiIdentifiedItem = {
  name: string;
  category: LeftoverCategory | PantryCategory;
  estimated_expiry_days?: number;
};

export type AiRecipeDraft = {
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  source_url?: string;
  tags?: string;
  ingredients: RecipeIngredientInput[];
};

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('file-read-failed'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] ?? '');
    };
    reader.readAsDataURL(blob);
  });
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

async function requestGeminiJson<T>(
  householdId: string,
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
) {
  if (!GEMINI_KEY) {
    throw new Error('missing-gemini-key');
  }

  if (isDailyLimitReached('gemini', householdId)) {
    throw new Error(`gemini-limit-reached:${GEMINI_DAILY_LIMIT}`);
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(GEMINI_KEY)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`gemini-request-failed:${response.status}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')?.trim();
  if (!text) {
    throw new Error('gemini-empty-response');
  }

  incrementDailyUsage('gemini', householdId);
  return JSON.parse(extractJson(text)) as T;
}

function toRecipeDraft(input: unknown): AiRecipeDraft {
  const draft = input as Partial<AiRecipeDraft>;
  if (!draft.title || !draft.instructions || !Array.isArray(draft.ingredients)) {
    throw new Error('invalid-recipe-draft');
  }

  return {
    title: String(draft.title).trim(),
    description: draft.description ? String(draft.description).trim() : undefined,
    instructions: String(draft.instructions).trim(),
    servings: typeof draft.servings === 'number' ? draft.servings : undefined,
    prep_time: typeof draft.prep_time === 'number' ? draft.prep_time : undefined,
    cook_time: typeof draft.cook_time === 'number' ? draft.cook_time : undefined,
    source_url: draft.source_url ? String(draft.source_url).trim() : undefined,
    tags: draft.tags ? String(draft.tags).trim() : undefined,
    ingredients: draft.ingredients
      .map((ingredient) => ({
        name: String(ingredient.name ?? '').trim(),
        quantity: typeof ingredient.quantity === 'number' ? ingredient.quantity : undefined,
        unit: ingredient.unit ? String(ingredient.unit).trim() : undefined,
        optional: Boolean(ingredient.optional),
      }))
      .filter((ingredient) => ingredient.name.length > 0),
  };
}

function toIdentifiedItem(input: unknown) {
  const item = input as Partial<AiIdentifiedItem>;
  if (!item.name || !item.category) {
    throw new Error('invalid-identified-item');
  }

  return {
    name: String(item.name).trim(),
    category: String(item.category).trim(),
    estimated_expiry_days:
      typeof item.estimated_expiry_days === 'number' ? item.estimated_expiry_days : undefined,
  } as AiIdentifiedItem;
}

export async function identifyItemFromPhoto(
  householdId: string,
  photo: Blob,
  target: 'leftover' | 'pantry',
) {
  const base64 = await blobToBase64(photo);
  const targetPrompt = target === 'leftover'
    ? 'Identify the cooked leftover in this image.'
    : 'Identify the pantry or grocery item in this image.';

  return toIdentifiedItem(
    await requestGeminiJson<AiIdentifiedItem>(householdId, [
      {
        inlineData: {
          mimeType: photo.type || 'image/jpeg',
          data: base64,
        },
      },
      {
        text: `${targetPrompt} Respond with JSON only in this shape: { "name": "...", "category": "...", "estimated_expiry_days": 0 }. Categories must be one of: meat, poultry, seafood, veg, dairy, grains, prepared, other, condiment, spice, beverage, frozen, baking, canned.`,
      },
    ]),
  );
}

export async function parseRecipeFromUrl(householdId: string, url: string) {
  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        text: `Extract a recipe from this public URL: ${url}. Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "source_url": "...", "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }`,
      },
    ]),
  );
}

export async function parseRecipeFromText(householdId: string, text: string) {
  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        text: `Extract and structure the following recipe text. Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }\n\n${text}`,
      },
    ]),
  );
}

export async function parseRecipeFromPhoto(householdId: string, photo: Blob) {
  const base64 = await blobToBase64(photo);

  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        inlineData: {
          mimeType: photo.type || 'image/jpeg',
          data: base64,
        },
      },
      {
        text: 'Extract and structure the recipe shown in this image. Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }',
      },
    ]),
  );
}

export async function generateRecipeFromPantry(householdId: string, pantryItems: string[]) {
  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        text: `I have these ingredients in my pantry: ${pantryItems.join(', ')}. Create one practical recipe that uses only these items plus basic staples like salt, pepper, oil, and water. Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }`,
      },
    ]),
  );
}
