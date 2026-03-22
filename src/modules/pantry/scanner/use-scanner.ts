import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPantryItemByBarcode } from '@/modules/pantry/pantry-api';
import { lookupOpenFoodFactsProduct } from '@/modules/pantry/scanner/open-food-facts-api';
import type { PantryItemRecord } from '@/modules/pantry/pantry-api';
import type { OpenFoodFactsProduct } from '@/modules/pantry/scanner/open-food-facts-api';
import { useHousehold } from '@/shared/hooks/use-household';

export type ScannerResult =
  | { outcome: 'existing-match'; item: PantryItemRecord; barcode: string }
  | { outcome: 'product-found'; product: OpenFoodFactsProduct; barcode: string }
  | { outcome: 'not-found'; barcode: string }
  | { outcome: 'lookup-error'; barcode: string };

export function useResolveScannedBarcode() {
  const { i18n } = useTranslation();
  const { householdId } = useHousehold();

  const lookupMutation = useMutation({
    mutationFn: async (barcode: string): Promise<ScannerResult> => {
      if (!householdId) {
        throw new Error('missing-household-context');
      }

      const existingItem = await getPantryItemByBarcode(householdId, barcode);
      if (existingItem) {
        return { outcome: 'existing-match', item: existingItem, barcode };
      }

      const result = await lookupOpenFoodFactsProduct(barcode, i18n.language);
      if (result.type === 'found') {
        return { outcome: 'product-found', product: result.product, barcode };
      }
      if (result.type === 'not-found') {
        return { outcome: 'not-found', barcode };
      }
      return { outcome: 'lookup-error', barcode };
    },
  });

  return {
    resolveBarcode: lookupMutation.mutateAsync,
    isResolving: lookupMutation.isPending,
    error: lookupMutation.error,
    reset: lookupMutation.reset,
  };
}
