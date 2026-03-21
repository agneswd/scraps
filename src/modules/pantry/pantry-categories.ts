import {
  Beef,
  Cake,
  Candy,
  Carrot,
  Cherry,
  CookingPot,
  Drumstick,
  Fish,
  Flame,
  Milk,
  Package,
  Sliders,
  Snowflake,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

export type PantryCategory =
  | 'meat'
  | 'poultry'
  | 'seafood'
  | 'veg'
  | 'dairy'
  | 'grains'
  | 'prepared'
  | 'other'
  | 'condiment'
  | 'spice'
  | 'beverage'
  | 'frozen'
  | 'baking'
  | 'canned';

export type PantryStatus = 'in_stock' | 'low' | 'finished';

export const PANTRY_CATEGORY_ICONS: Record<PantryCategory, LucideIcon> = {
  meat: Beef,
  poultry: Drumstick,
  seafood: Fish,
  veg: Carrot,
  dairy: Milk,
  grains: Wheat,
  prepared: CookingPot,
  other: Sliders,
  condiment: Cherry,
  spice: Flame,
  beverage: Cherry,
  frozen: Snowflake,
  baking: Cake,
  canned: Package,
};

export const PANTRY_CATEGORIES: PantryCategory[] = [
  'meat',
  'poultry',
  'seafood',
  'veg',
  'dairy',
  'grains',
  'prepared',
  'condiment',
  'spice',
  'beverage',
  'frozen',
  'baking',
  'canned',
  'other',
];
