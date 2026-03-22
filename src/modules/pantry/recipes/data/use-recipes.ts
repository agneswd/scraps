import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/shared/hooks/use-household';
import { archiveAndDeleteRecipe } from '@/modules/settings/data/history-api';
import {
  createRecipe,
  listRecipesWithIngredients,
  updateRecipe,
  type RecipeIngredientInput,
  type RecipeWithIngredients,
} from '@/modules/pantry/recipes/data/recipe-api';

const RECIPE_KEY = ['recipes'] as const;

type RecipeMutationInput = {
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

export function useRecipes() {
  return useQuery({
    queryKey: RECIPE_KEY,
    queryFn: listRecipesWithIngredients,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  const { householdId, userId } = useHousehold();

  return useMutation({
    mutationFn: async (input: RecipeMutationInput) => {
      if (!householdId || !userId) {
        throw new Error('Missing household context.');
      }

      return createRecipe({
        household_id: householdId,
        created_by: userId,
        ...input,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPE_KEY });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, ...input }: { recipeId: string } & RecipeMutationInput) =>
      updateRecipe(recipeId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPE_KEY });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeWithIngredients: RecipeWithIngredients) => archiveAndDeleteRecipe(recipeWithIngredients),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPE_KEY });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
