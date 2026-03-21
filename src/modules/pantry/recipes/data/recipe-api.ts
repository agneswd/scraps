import type { RecordModel } from 'pocketbase';
import { pocketbase } from '@/shared/api/pocketbase';

export type RecipeRecord = RecordModel & {
  household_id: string;
  created_by: string;
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  photo?: string;
  source_url?: string;
  tags?: string;
};

export type RecipeIngredientRecord = RecordModel & {
  recipe_id: string;
  name: string;
  name_normalized: string;
  quantity?: number;
  unit?: string;
  optional?: boolean;
};

export type RecipeIngredientInput = {
  name: string;
  quantity?: number;
  unit?: string;
  optional?: boolean;
};

export type RecipeInput = {
  household_id: string;
  created_by: string;
  title: string;
  description?: string;
  instructions: string;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  source_url?: string;
  tags?: string;
  photo?: Blob | null;
  ingredients: RecipeIngredientInput[];
};

export type RecipeWithIngredients = {
  recipe: RecipeRecord;
  ingredients: RecipeIngredientRecord[];
};

export function normalizeIngredientName(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(fresh|dried|canned|frozen|chopped|diced|sliced|minced|optional|to taste)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.endsWith('ies')) {
    return `${normalized.slice(0, -3)}y`;
  }

  if (normalized.endsWith('es')) {
    return normalized.slice(0, -2);
  }

  if (normalized.endsWith('s') && normalized.length > 3) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function buildRecipeFormData(
  input: Partial<Omit<RecipeInput, 'ingredients'>>,
  options: { includeOwnerFields: boolean },
) {
  const formData = new FormData();
  if (options.includeOwnerFields && input.household_id) formData.set('household_id', input.household_id);
  if (options.includeOwnerFields && input.created_by) formData.set('created_by', input.created_by);
  if (input.title !== undefined) formData.set('title', input.title);
  if (input.instructions !== undefined) formData.set('instructions', input.instructions);

  if (input.description) formData.set('description', input.description);
  if (input.servings !== undefined) formData.set('servings', String(input.servings));
  if (input.prep_time !== undefined) formData.set('prep_time', String(input.prep_time));
  if (input.cook_time !== undefined) formData.set('cook_time', String(input.cook_time));
  if (input.source_url) formData.set('source_url', input.source_url);
  if (input.tags) formData.set('tags', input.tags);

  if (input.photo) {
    const ext = input.photo.type === 'image/jpeg' ? 'jpg' : 'webp';
    formData.set('photo', new File([input.photo], `recipe.${ext}`, { type: input.photo.type }));
  }

  return formData;
}

async function createRecipeIngredients(recipeId: string, ingredients: RecipeIngredientInput[]) {
  return Promise.all(
    ingredients
      .filter((ingredient) => ingredient.name.trim().length > 0)
      .map((ingredient) =>
        pocketbase.collection('recipe_ingredients').create<RecipeIngredientRecord>({
          recipe_id: recipeId,
          name: ingredient.name.trim(),
          name_normalized: normalizeIngredientName(ingredient.name),
          quantity: ingredient.quantity,
          unit: ingredient.unit?.trim() || undefined,
          optional: Boolean(ingredient.optional),
        }),
      ),
  );
}

export async function listRecipesWithIngredients() {
  const [recipes, ingredients] = await Promise.all([
    pocketbase.collection('recipes').getFullList<RecipeRecord>({ sort: '-updated' }),
    pocketbase.collection('recipe_ingredients').getFullList<RecipeIngredientRecord>({ sort: 'created' }),
  ]);

  const ingredientsByRecipe = new Map<string, RecipeIngredientRecord[]>();
  for (const ingredient of ingredients) {
    const current = ingredientsByRecipe.get(ingredient.recipe_id) ?? [];
    current.push(ingredient);
    ingredientsByRecipe.set(ingredient.recipe_id, current);
  }

  return recipes.map((recipe) => ({
    recipe,
    ingredients: ingredientsByRecipe.get(recipe.id) ?? [],
  }));
}

export async function createRecipe(input: RecipeInput) {
  const recipe = await pocketbase.collection('recipes').create<RecipeRecord>(
    buildRecipeFormData(input, { includeOwnerFields: true }),
  );

  await createRecipeIngredients(recipe.id, input.ingredients);
  return recipe;
}

export async function updateRecipe(
  recipeId: string,
  input: Omit<RecipeInput, 'household_id' | 'created_by'>,
) {
  await pocketbase.collection('recipes').update<RecipeRecord>(
    recipeId,
    buildRecipeFormData(input, { includeOwnerFields: false }),
  );

  const existingIngredients = await pocketbase.collection('recipe_ingredients').getFullList<RecipeIngredientRecord>({
    filter: `recipe_id = "${recipeId}"`,
  });

  await Promise.all(
    existingIngredients.map((ingredient) => pocketbase.collection('recipe_ingredients').delete(ingredient.id)),
  );

  await createRecipeIngredients(recipeId, input.ingredients);
}

export async function deleteRecipe(recipeId: string) {
  return pocketbase.collection('recipes').delete(recipeId);
}
