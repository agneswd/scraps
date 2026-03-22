import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';
import type { PantryCategory } from '@/modules/pantry/pantry-categories';
import type { RecipeIngredientInput } from '@/modules/pantry/recipes/data/recipe-api';
import { getGeminiModelHierarchy, shouldRetryGeminiModel } from '@/modules/ai/model-hierarchy';
import { GEMINI_DAILY_LIMIT, incrementDailyUsage, isDailyLimitReached } from '@/modules/ai/rate-limits';
import i18n from '@/shared/i18n/i18n';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY?.trim();

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

function getAiOutputLanguage() {
  return i18n.resolvedLanguage || i18n.language || 'en';
}

function getLanguageInstruction() {
  return `Write all human-readable field values in the selected app language (${getAiOutputLanguage()}). Keep JSON keys in English exactly as requested.`;
}

function getRecipeFormattingInstruction() {
  return 'Format instructions as clear numbered steps with a blank line between each step. Use normal capitalization for titles, ingredient names, and instruction text.';
}

function capitalizeFirstLetter(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
}

function formatRecipeInstructions(text: string) {
  const normalized = text
    .replace(/\r/g, '')
    .replace(/\t+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) {
    return '';
  }

  const fromLines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:step\s*)?\d+[.):-]?\s*/i, '').replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  const candidateSteps = fromLines.length > 1
    ? fromLines
    : normalized
        .split(/(?<=[.!?])\s+(?=[\p{L}\d])/u)
        .map((line) => line.replace(/^\s*(?:step\s*)?\d+[.):-]?\s*/i, '').trim())
        .filter(Boolean);

  return candidateSteps
    .map((step, index) => `${index + 1}. ${capitalizeFirstLetter(step)}`)
    .join('\n\n');
}

function getGeminiEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function requestGeminiJsonForModel<T>(
  model: string,
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
) {
  const endpoint = getGeminiEndpoint(model);
  const response = await fetch(`${endpoint}?key=${encodeURIComponent(GEMINI_KEY ?? '')}`, {
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

  try {
    return JSON.parse(extractJson(text)) as T;
  } catch {
    throw new Error('invalid-json-response');
  }
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

  let lastError: unknown = null;

  for (const model of getGeminiModelHierarchy()) {
    try {
      const result = await requestGeminiJsonForModel<T>(model, parts);
      incrementDailyUsage('gemini', householdId);
      return result;
    } catch (error) {
      lastError = error;
      if (!shouldRetryGeminiModel(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('gemini-request-failed');
}

function toRecipeDraft(input: unknown): AiRecipeDraft {
  const draft = input as Partial<AiRecipeDraft>;
  if (!draft.title || !draft.instructions || !Array.isArray(draft.ingredients)) {
    throw new Error('invalid-recipe-draft');
  }

  return {
    title: capitalizeFirstLetter(String(draft.title)),
    description: draft.description ? capitalizeFirstLetter(String(draft.description)) : undefined,
    instructions: formatRecipeInstructions(String(draft.instructions)),
    servings: typeof draft.servings === 'number' ? draft.servings : undefined,
    prep_time: typeof draft.prep_time === 'number' ? draft.prep_time : undefined,
    cook_time: typeof draft.cook_time === 'number' ? draft.cook_time : undefined,
    source_url: draft.source_url ? String(draft.source_url).trim() : undefined,
    tags: draft.tags ? String(draft.tags).trim() : undefined,
    ingredients: draft.ingredients
      .map((ingredient) => ({
        name: capitalizeFirstLetter(String(ingredient.name ?? '')),
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
        text: `${targetPrompt} ${getLanguageInstruction()} Respond with JSON only in this shape: { "name": "...", "category": "...", "estimated_expiry_days": 0 }. The "category" value must be one of these exact internal values: meat, poultry, seafood, veg, dairy, grains, prepared, other, condiment, spice, beverage, frozen, baking, canned.`,
      },
    ]),
  );
}

export async function parseRecipeFromUrl(householdId: string, url: string) {
  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        text: `Extract a recipe from this public URL: ${url}. ${getLanguageInstruction()} ${getRecipeFormattingInstruction()} Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "source_url": "...", "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }`,
      },
    ]),
  );
}

export async function parseRecipeFromText(householdId: string, text: string) {
  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        text: `Extract and structure the following recipe text. ${getLanguageInstruction()} ${getRecipeFormattingInstruction()} Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }\n\n${text}`,
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
        text: `Extract and structure the recipe shown in this image. ${getLanguageInstruction()} ${getRecipeFormattingInstruction()} Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }`,
      },
    ]),
  );
}

export async function generateRecipeFromPantry(
  householdId: string,
  pantryItems: string[],
  prompt?: string,
) {
  const promptInstruction = prompt?.trim()
    ? `Also follow this user preference as closely as possible while still using the pantry items: ${prompt.trim()}.`
    : 'No extra user preference was provided.';

  return toRecipeDraft(
    await requestGeminiJson<AiRecipeDraft>(householdId, [
      {
        text: `I have these ingredients in my pantry: ${pantryItems.join(', ')}. Create one practical recipe that uses only these items plus basic staples like salt, pepper, oil, and water. ${promptInstruction} ${getLanguageInstruction()} ${getRecipeFormattingInstruction()} Respond with JSON only in this shape: { "title": "...", "description": "...", "servings": 0, "prep_time": 0, "cook_time": 0, "tags": "...", "ingredients": [{ "name": "...", "quantity": 0, "unit": "...", "optional": false }], "instructions": "..." }`,
      },
    ]),
  );
}
