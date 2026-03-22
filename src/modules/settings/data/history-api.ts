import type { RecordModel } from 'pocketbase';
import { pocketbase, assertPbId } from '@/shared/api/pocketbase';
import {
  createLeftover,
  deleteLeftover,
  listArchivedLeftovers,
  restoreLeftover,
  type LeftoverRecord,
} from '@/modules/dashboard/leftover-api';
import {
  createPantryItem,
  deletePantryItem,
  type PantryItemRecord,
} from '@/modules/pantry/pantry-api';
import {
  createRecipe,
  deleteRecipe,
  type RecipeInput,
  type RecipeWithIngredients,
} from '@/modules/pantry/recipes/data/recipe-api';
import {
  createShoppingListItem,
  deleteShoppingListItem,
  type ShoppingListItemInput,
  type ShoppingListItemRecord,
} from '@/modules/shopping-list/data/shopping-list-api';
import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';
import type { PantryCategory, PantryStatus } from '@/modules/pantry/pantry-categories';

type HistoryEntityType = 'leftover' | 'pantry_item' | 'recipe' | 'shopping_item';

type DeletedHistoryRecord = RecordModel & {
  household_id: string;
  entity_type: HistoryEntityType;
  action: 'deleted';
  title: string;
  category?: string;
  snapshot_json: string;
};

type DeletedLeftoverSnapshot = {
  household_id: string;
  added_by: string;
  item_name: string;
  category: LeftoverCategory;
  expiry_date: string;
  notes?: string;
  status: 'active';
};

type DeletedPantrySnapshot = {
  household_id: string;
  added_by: string;
  name: string;
  barcode?: string;
  category: PantryCategory;
  quantity: number;
  unit?: string;
  expiry_date?: string;
  status: PantryStatus;
};

type DeletedRecipeSnapshot = Omit<RecipeInput, 'photo'> & {
  photo?: null;
};

type DeletedShoppingItemSnapshot = ShoppingListItemInput;

type DeletedSnapshot =
  | DeletedLeftoverSnapshot
  | DeletedPantrySnapshot
  | DeletedRecipeSnapshot
  | DeletedShoppingItemSnapshot;

const HISTORY_LIMIT = 50;

export type HistoryEntry =
  | {
      id: string;
      kind: 'archived-leftover';
      title: string;
      updated: string;
      action: 'consumed' | 'wasted';
      category: LeftoverCategory;
    }
  | {
      id: string;
      kind: 'deleted-item';
      title: string;
      updated: string;
      action: 'deleted';
      entityType: HistoryEntityType;
      category?: string;
    };

async function createDeletedHistoryEntry(
  householdId: string,
  entityType: HistoryEntityType,
  title: string,
  snapshot: DeletedSnapshot,
  category?: string,
) {
  return pocketbase.collection('history_entries').create<DeletedHistoryRecord>({
    household_id: householdId,
    entity_type: entityType,
    action: 'deleted',
    title,
    category,
    snapshot_json: JSON.stringify(snapshot),
  });
}

async function trimDeletedHistoryEntries(householdId: string) {
  const entries = await pocketbase.collection('history_entries').getFullList<DeletedHistoryRecord>({
    filter: `household_id = "${assertPbId(householdId, 'householdId')}"`,
    sort: '-updated',
    fields: 'id,updated',
  });

  const staleEntries = entries.slice(HISTORY_LIMIT);
  await Promise.all(staleEntries.map((entry) => pocketbase.collection('history_entries').delete(entry.id)));
}

async function cleanupDeletedHistoryEntry(entryId: string) {
  try {
    await pocketbase.collection('history_entries').delete(entryId);
  } catch {
    // Best effort cleanup when delete archiving fails halfway through.
  }
}

export async function listHistoryEntries() {
  const [archivedLeftovers, deletedEntries] = await Promise.all([
    listArchivedLeftovers(HISTORY_LIMIT),
    pocketbase.collection('history_entries').getList<DeletedHistoryRecord>(1, HISTORY_LIMIT, {
      sort: '-updated',
      fields: 'id,title,category,entity_type,updated',
    }),
  ]);

  const history: HistoryEntry[] = [
    ...archivedLeftovers
      .filter((item) => item.status === 'consumed' || item.status === 'wasted')
      .map((item) => ({
        id: item.id,
        kind: 'archived-leftover' as const,
        title: item.item_name,
        updated: item.updated,
        action: item.status === 'consumed' ? 'consumed' as const : 'wasted' as const,
        category: item.category,
      })),
    ...deletedEntries.items.map((item) => ({
      id: item.id,
      kind: 'deleted-item' as const,
      title: item.title,
      updated: item.updated,
      action: 'deleted' as const,
      entityType: item.entity_type,
      category: item.category,
    })),
  ];

  return history
    .sort((left, right) => right.updated.localeCompare(left.updated))
    .slice(0, HISTORY_LIMIT);
}

export async function restoreHistoryEntry(entry: HistoryEntry) {
  if (entry.kind === 'archived-leftover') {
    await restoreLeftover(entry.id);
    return;
  }

  const record = await pocketbase.collection('history_entries').getOne<DeletedHistoryRecord>(entry.id);
  const snapshot = JSON.parse(record.snapshot_json) as DeletedSnapshot;

  switch (record.entity_type) {
    case 'leftover': {
      const value = snapshot as DeletedLeftoverSnapshot;
      await createLeftover({
        household_id: value.household_id,
        added_by: value.added_by,
        item_name: value.item_name,
        category: value.category,
        expiry_date: value.expiry_date,
        notes: value.notes,
        status: 'active',
      });
      break;
    }
    case 'pantry_item': {
      const value = snapshot as DeletedPantrySnapshot;
      await createPantryItem({
        household_id: value.household_id,
        added_by: value.added_by,
        name: value.name,
        barcode: value.barcode,
        category: value.category,
        quantity: value.quantity,
        unit: value.unit,
        expiry_date: value.expiry_date,
        status: value.status,
      });
      break;
    }
    case 'recipe': {
      const value = snapshot as DeletedRecipeSnapshot;
      await createRecipe({
        household_id: value.household_id,
        created_by: value.created_by,
        title: value.title,
        description: value.description,
        instructions: value.instructions,
        servings: value.servings,
        prep_time: value.prep_time,
        cook_time: value.cook_time,
        source_url: value.source_url,
        tags: value.tags,
        ingredients: value.ingredients,
      });
      break;
    }
    case 'shopping_item': {
      const value = snapshot as DeletedShoppingItemSnapshot;
      await createShoppingListItem(value);
      break;
    }
    default:
      throw new Error('unknown-history-entity');
  }

  await pocketbase.collection('history_entries').delete(record.id);
}

export async function archiveAndDeleteLeftover(leftover: LeftoverRecord) {
  const historyEntry = await createDeletedHistoryEntry(
    leftover.household_id,
    'leftover',
    leftover.item_name,
    {
      household_id: leftover.household_id,
      added_by: leftover.added_by,
      item_name: leftover.item_name,
      category: leftover.category,
      expiry_date: leftover.expiry_date,
      notes: leftover.notes,
      status: 'active',
    },
    leftover.category,
  );

  try {
    await deleteLeftover(leftover.id);
    await trimDeletedHistoryEntries(leftover.household_id);
  } catch (error) {
    await cleanupDeletedHistoryEntry(historyEntry.id);
    throw error;
  }
}

export async function archiveAndDeletePantryItem(item: PantryItemRecord) {
  const historyEntry = await createDeletedHistoryEntry(
    item.household_id,
    'pantry_item',
    item.name,
    {
      household_id: item.household_id,
      added_by: item.added_by,
      name: item.name,
      barcode: item.barcode,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: item.expiry_date,
      status: item.status,
    },
    item.category,
  );

  try {
    await deletePantryItem(item.id);
    await trimDeletedHistoryEntries(item.household_id);
  } catch (error) {
    await cleanupDeletedHistoryEntry(historyEntry.id);
    throw error;
  }
}

export async function archiveAndDeleteRecipe(recipeWithIngredients: RecipeWithIngredients) {
  const historyEntry = await createDeletedHistoryEntry(
    recipeWithIngredients.recipe.household_id,
    'recipe',
    recipeWithIngredients.recipe.title,
    {
      household_id: recipeWithIngredients.recipe.household_id,
      created_by: recipeWithIngredients.recipe.created_by,
      title: recipeWithIngredients.recipe.title,
      description: recipeWithIngredients.recipe.description,
      instructions: recipeWithIngredients.recipe.instructions,
      servings: recipeWithIngredients.recipe.servings,
      prep_time: recipeWithIngredients.recipe.prep_time,
      cook_time: recipeWithIngredients.recipe.cook_time,
      source_url: recipeWithIngredients.recipe.source_url,
      tags: recipeWithIngredients.recipe.tags,
      ingredients: recipeWithIngredients.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        optional: ingredient.optional,
      })),
    },
  );

  try {
    await deleteRecipe(recipeWithIngredients.recipe.id);
    await trimDeletedHistoryEntries(recipeWithIngredients.recipe.household_id);
  } catch (error) {
    await cleanupDeletedHistoryEntry(historyEntry.id);
    throw error;
  }
}

export async function archiveAndDeleteShoppingItem(item: ShoppingListItemRecord) {
  const historyEntry = await createDeletedHistoryEntry(
    item.household_id,
    'shopping_item',
    item.name,
    {
      household_id: item.household_id,
      added_by: item.added_by,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      recipe_id: item.recipe_id,
      checked: item.checked,
    },
  );

  try {
    await deleteShoppingListItem(item.id);
    await trimDeletedHistoryEntries(item.household_id);
  } catch (error) {
    await cleanupDeletedHistoryEntry(historyEntry.id);
    throw error;
  }
}

export async function archiveAndDeleteShoppingItems(items: ShoppingListItemRecord[]) {
  for (const item of items) {
    await archiveAndDeleteShoppingItem(item);
  }
}

export async function clearAllHistory(householdId: string) {
  const validId = assertPbId(householdId, 'householdId');

  // Only delete history_entries (the undo-log for deleted items).
  // Archived leftovers (consumed/wasted) live in the leftovers collection
  // and are the source of truth for stats — they must not be removed here.
  const entries = await pocketbase.collection('history_entries').getFullList<DeletedHistoryRecord>({
    filter: `household_id = "${validId}"`,
    fields: 'id',
  });

  await Promise.all(entries.map((entry) => pocketbase.collection('history_entries').delete(entry.id)));
}