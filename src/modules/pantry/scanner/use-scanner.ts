import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPantryItemByBarcode } from '@/modules/pantry/pantry-api';
import { lookupOpenFoodFactsProduct } from '@/modules/pantry/scanner/open-food-facts-api';
import { useHousehold } from '@/shared/hooks/use-household';

export function useScanner() {
  const { i18n } = useTranslation();
  const { householdId } = useHousehold();

  const lookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      if (!householdId) {
        throw new Error('missing-household-context');
      }

      const existingItem = await getPantryItemByBarcode(householdId, barcode);
      if (existingItem) {
        return {
          barcode,
          existingItem,
          product: null,
        };
      }

      const product = await lookupOpenFoodFactsProduct(barcode, i18n.language);
      return {
        barcode,
        existingItem: null,
        product,
      };
    },
  });

  return {
    resolveBarcode: lookupMutation.mutateAsync,
    isResolving: lookupMutation.isPending,
    error: lookupMutation.error,
    reset: lookupMutation.reset,
  };
}
