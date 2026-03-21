import type { PantryItemRecord } from '@/modules/pantry/pantry-api';
import {
  normalizeIngredientName,
  type RecipeWithIngredients,
} from '@/modules/pantry/recipes/data/recipe-api';

export type RecipeMatchResult = RecipeWithIngredients & {
  matched: string[];
  missing: string[];
  matchRatio: number;
  canMake: boolean;
};

function getAvailablePantryNames(pantryItems: PantryItemRecord[]) {
  return new Set(
    pantryItems
      .filter((item) => item.status !== 'finished' && item.quantity > 0)
      .map((item) => normalizeIngredientName(item.name)),
  );
}

export function matchRecipesToPantry(
  recipes: RecipeWithIngredients[],
  pantryItems: PantryItemRecord[],
): RecipeMatchResult[] {
  const pantryNames = getAvailablePantryNames(pantryItems);

  return recipes
    .map((recipeWithIngredients) => {
      const requiredIngredients = recipeWithIngredients.ingredients.filter((ingredient) => !ingredient.optional);
      const requiredNames = requiredIngredients.map(
        (ingredient) => ingredient.name_normalized || normalizeIngredientName(ingredient.name),
      );

      const matched = requiredNames.filter((name) => pantryNames.has(name));
      const missing = requiredNames.filter((name) => !pantryNames.has(name));
      const matchRatio = requiredNames.length === 0 ? 0 : matched.length / requiredNames.length;

      return {
        ...recipeWithIngredients,
        matched,
        missing,
        matchRatio,
        canMake: missing.length === 0 && requiredNames.length > 0,
      };
    })
    .sort((left, right) => {
      if (left.canMake !== right.canMake) {
        return left.canMake ? -1 : 1;
      }

      if (left.matchRatio !== right.matchRatio) {
        return right.matchRatio - left.matchRatio;
      }

      if (left.missing.length !== right.missing.length) {
        return left.missing.length - right.missing.length;
      }

      return right.ingredients.length - left.ingredients.length;
    });
}

export function findUnusedPantryItems(
  pantryItems: PantryItemRecord[],
  recipes: RecipeWithIngredients[],
) {
  const ingredientNames = new Set(
    recipes.flatMap((recipeWithIngredients) =>
      recipeWithIngredients.ingredients.map(
        (ingredient) => ingredient.name_normalized || normalizeIngredientName(ingredient.name),
      ),
    ),
  );

  return pantryItems.filter(
    (item) => item.status !== 'finished'
      && item.quantity > 0
      && !ingredientNames.has(normalizeIngredientName(item.name)),
  );
}
