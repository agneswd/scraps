# Scraps — Implementation Plan (V2: Pantry, Recipes, Shopping List & AI)

> Extends the V1 leftover tracker with a full pantry management system, curated recipe book,
> pantry-aware recipe matching, shopping list, barcode scanning, and Gemini AI integration.

---

## 0. Design Parameters

Adapted from the **taste-skill** for a daily-use mobile-first household app:

| Parameter | Value | Rationale |
|---|---|---|
| DESIGN_VARIANCE | 5 | Utility app — clean and functional, not experimental |
| MOTION_INTENSITY | 6 | Matches existing spring physics (framer-motion) |
| VISUAL_DENSITY | 5 | Daily app mode — standard spacing, scan-friendly |

### Existing Design System (Preserved)

| Aspect | Current State |
|---|---|
| Font | Satoshi (premium sans-serif — taste-skill compliant) |
| Colors | Slate neutral base, brand-green accent (`brand-500: #16a34a`) |
| Shadows | Tinted 3-tier system: `soft`, `float`, `elevated` |
| Radii | `rounded-2xl` cards, `rounded-[2rem]` modals, `rounded-5xl` large surfaces |
| Motion | Framer Motion springs (`stiffness: 300, damping: 30`), `AnimatePresence` page transitions |
| Dark mode | `class` strategy via Tailwind, toggled in settings |
| Layout | `min-h-[100dvh]`, `max-w-lg` mobile / `max-w-2xl` desktop |
| Icons | Lucide React, `strokeWidth: 1.8` navigation / `2.0` actions |

### New Design Decisions

- **No emojis** — Lucide icons exclusively
- **No Inter font** — Satoshi already configured
- **Card usage** — Cards for pantry items and recipe cards only where elevation = hierarchy. Lists use `divide-y` separators
- **Loading states** — Skeletal loaders matching layout sizes (existing pattern in `DashboardSkeleton`)
- **Empty states** — Composed illustrations with clear CTAs
- **Tactile feedback** — `active:scale-[0.98]` on interactive elements (existing pattern)
- **Staggered reveals** — `staggerChildren` for list items on mount
- **Tab switchers** — Segmented control with `layoutId` shared element transitions
- **Form labels** — Above input, helper text optional, error text below

---

## 1. Consolidated V2 Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Pantry ↔ Leftovers | Fully separate flows and collections |
| 2 | Barcode dedup | Same barcode → increment quantity (no duplicate entries) |
| 3 | Recipes location | Inside Pantry page as a sub-tab |
| 4 | Shopping list | Own top-level tab in bottom nav |
| 5 | Recipe source | **User-curated only** — no random API suggestions. Spoonacular reserved for optional feature later |
| 6 | Recipe input methods | Manual entry, AI parsing from URL, AI parsing from photo/image, AI parsing from pasted text |
| 7 | Pantry input methods | Manual entry, barcode scan (Open Food Facts), AI photo identification (Gemini) |
| 8 | Leftover AI | Photo → Gemini auto-fills name, category, estimated expiry |
| 9 | Pantry AI | Photo → Gemini identifies product → auto-fills name, category |
| 10 | Recipe AI | Generate recipe from pantry contents via Gemini |
| 11 | Recipe matching | Match saved recipes against pantry; sort by fewest missing ingredients |
| 12 | Unused ingredients | List pantry items not referenced in any saved recipe |
| 13 | Shopping list generation | From recipe → auto-list missing ingredients; manual additions; check-off items |
| 14 | Pantry categories | Expanded: existing 8 + `condiment`, `spice`, `beverage`, `frozen`, `baking`, `canned` (14 total) |
| 15 | API keys | `VITE_SPOONACULAR_KEY` and `VITE_GEMINI_KEY` in `.env` (safe: self-hosted behind Cloudflare Zero Trust) |
| 16 | Gemini model | Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`) — free tier, 500 req/day, vision capable |
| 17 | Open Food Facts | Locale-aware: route API calls through `{lang}.openfoodfacts.org` based on i18n locale |

---

## 2. Technical Stack Additions

| Layer | Addition | Notes |
|---|---|---|
| Barcode scanning | `html5-qrcode` | Stable, works on all mobile browsers over HTTPS |
| Product lookup | Open Food Facts API | Free, open-source, excellent EU coverage |
| AI | Gemini 3.1 Flash Lite (REST) | Vision + text, 500 req/day free tier |
| Recipe discovery (optional) | Spoonacular API | 150 req/day free tier, `findByIngredients` endpoint |

### New Dependencies

```bash
npm install html5-qrcode
```

No SDK needed for Gemini or Open Food Facts — both are REST APIs called via `fetch`.

---

## 3. PocketBase Schema (New Collections)

### 3a. `pantry_items`

```javascript
const pantryItems = new Collection({
  name: 'pantry_items',
  type: 'base',
  listRule: '@request.auth.household_id ?= household_id',
  viewRule: '@request.auth.household_id ?= household_id',
  createRule: '@request.auth.household_id ?= @request.body.household_id',
  updateRule: '@request.auth.household_id ?= household_id',
  deleteRule: '@request.auth.household_id ?= household_id',
  fields: [
    { type: 'relation', name: 'household_id', required: true, maxSelect: 1, collectionId: '<households_id>', cascadeDelete: false },
    { type: 'relation', name: 'added_by', required: true, maxSelect: 1, collectionId: '<users_id>', cascadeDelete: false },
    { type: 'text', name: 'name', required: true, presentable: true, min: 1 },
    { type: 'text', name: 'barcode', required: false },
    { type: 'select', name: 'category', required: true, maxSelect: 1,
      values: ['meat','poultry','seafood','veg','dairy','grains','prepared','other',
               'condiment','spice','beverage','frozen','baking','canned'] },
    { type: 'number', name: 'quantity', required: true, min: 0 },
    { type: 'text', name: 'unit', required: false, max: 20 },
    { type: 'date', name: 'expiry_date', required: false },
    { type: 'file', name: 'photo', required: false, maxSelect: 1, maxSize: 2097152,
      mimeTypes: ['image/jpeg','image/png','image/webp'] },
    { type: 'select', name: 'status', required: true, maxSelect: 1,
      values: ['in_stock', 'low', 'finished'] },
    { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
    { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
  ],
});
```

### 3b. `recipes`

```javascript
const recipes = new Collection({
  name: 'recipes',
  type: 'base',
  listRule: '@request.auth.household_id ?= household_id',
  viewRule: '@request.auth.household_id ?= household_id',
  createRule: '@request.auth.household_id ?= @request.body.household_id',
  updateRule: '@request.auth.household_id ?= household_id',
  deleteRule: '@request.auth.household_id ?= household_id',
  fields: [
    { type: 'relation', name: 'household_id', required: true, maxSelect: 1, collectionId: '<households_id>', cascadeDelete: false },
    { type: 'relation', name: 'created_by', required: true, maxSelect: 1, collectionId: '<users_id>', cascadeDelete: false },
    { type: 'text', name: 'title', required: true, presentable: true, min: 1 },
    { type: 'text', name: 'description', required: false, max: 500 },
    { type: 'text', name: 'instructions', required: true },
    { type: 'number', name: 'servings', required: false, min: 1 },
    { type: 'number', name: 'prep_time', required: false, min: 0 },
    { type: 'number', name: 'cook_time', required: false, min: 0 },
    { type: 'file', name: 'photo', required: false, maxSelect: 1, maxSize: 2097152,
      mimeTypes: ['image/jpeg','image/png','image/webp'] },
    { type: 'text', name: 'source_url', required: false },
    { type: 'text', name: 'tags', required: false },
    { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
    { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
  ],
});
```

### 3c. `recipe_ingredients`

```javascript
const recipeIngredients = new Collection({
  name: 'recipe_ingredients',
  type: 'base',
  listRule: '@request.auth.id != ""',
  viewRule: '@request.auth.id != ""',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != ""',
  deleteRule: '@request.auth.id != ""',
  fields: [
    { type: 'relation', name: 'recipe_id', required: true, maxSelect: 1, collectionId: '<recipes_id>', cascadeDelete: true },
    { type: 'text', name: 'name', required: true, min: 1 },
    { type: 'text', name: 'name_normalized', required: true, min: 1 },
    { type: 'number', name: 'quantity', required: false, min: 0 },
    { type: 'text', name: 'unit', required: false, max: 20 },
    { type: 'bool', name: 'optional', required: false },
    { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
    { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
  ],
});
```

### 3d. `shopping_list_items`

```javascript
const shoppingListItems = new Collection({
  name: 'shopping_list_items',
  type: 'base',
  listRule: '@request.auth.household_id ?= household_id',
  viewRule: '@request.auth.household_id ?= household_id',
  createRule: '@request.auth.household_id ?= @request.body.household_id',
  updateRule: '@request.auth.household_id ?= household_id',
  deleteRule: '@request.auth.household_id ?= household_id',
  fields: [
    { type: 'relation', name: 'household_id', required: true, maxSelect: 1, collectionId: '<households_id>', cascadeDelete: false },
    { type: 'relation', name: 'added_by', required: true, maxSelect: 1, collectionId: '<users_id>', cascadeDelete: false },
    { type: 'text', name: 'name', required: true, min: 1 },
    { type: 'number', name: 'quantity', required: false, min: 0 },
    { type: 'text', name: 'unit', required: false, max: 20 },
    { type: 'relation', name: 'recipe_id', required: false, maxSelect: 1, collectionId: '<recipes_id>', cascadeDelete: false },
    { type: 'bool', name: 'checked', required: false },
    { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
    { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
  ],
});
```

---

## 4. Module & File Structure

```
src/modules/
  pantry/                              # Pantry management (top-level route)
    pantry-api.ts                      # PocketBase CRUD for pantry_items
    pantry-categories.ts               # Category types, icons, expanded category map
    use-pantry.ts                      # React Query hooks (list, create, update, delete)
    PantryPage.tsx                     # Container with segmented tab switcher: Items | Recipes
    items/
      PantryItemList.tsx               # Grid/list of pantry items with status indicators
      PantryItemCard.tsx               # Individual item card with quantity badge
      AddPantryItemModal.tsx           # Multi-step modal: method → scan/AI/manual → form → save
      EditPantryItemModal.tsx          # Edit existing pantry item
    scanner/
      BarcodeScanner.tsx               # html5-qrcode camera wrapper component
      open-food-facts-api.ts           # OFF REST client with locale routing
      use-scanner.ts                   # Hook: scan → lookup → return product data
    recipes/
      recipe-api.ts                    # PocketBase CRUD for recipes + recipe_ingredients
      use-recipes.ts                   # React Query hooks for recipe CRUD
      recipe-matching.ts               # Pantry ↔ recipe matching algorithm
      RecipeList.tsx                   # Recipe list with "can make" / "missing N" badges
      RecipeCard.tsx                   # Individual recipe card (title, photo, match status)
      RecipeDetailModal.tsx            # Full recipe view (ingredients, instructions, cook action)
      AddRecipeModal.tsx               # Multi-step: method → AI/manual → ingredients → instructions → save
      EditRecipeModal.tsx              # Edit existing recipe
      UnusedIngredients.tsx            # Pantry items not in any saved recipe

  shopping-list/                       # Shopping list (top-level route)
    shopping-list-api.ts               # PocketBase CRUD for shopping_list_items
    use-shopping-list.ts               # React Query hooks
    ShoppingListPage.tsx               # Main shopping list view with check-off
    ShoppingListItem.tsx               # Individual item with swipe-to-check
    AddShoppingItemModal.tsx           # Quick-add modal
    GenerateFromRecipeModal.tsx        # Select recipe → auto-list missing ingredients

  ai/                                  # Gemini AI integration (shared across features)
    gemini-api.ts                      # Gemini REST client (vision + text generation)
    use-ai-identify.ts                 # Hook: photo → item identification (leftover/pantry)
    use-ai-recipe-parse.ts             # Hook: URL/text/image → structured recipe extraction
    use-ai-recipe-generate.ts          # Hook: pantry items → generated recipe
    AiScanButton.tsx                   # Reusable "Scan with AI" button component
    AiRecipeGenerateModal.tsx          # Review AI-generated recipe before saving
```

### Existing Modules Modified

```
src/app/
  Router.tsx                           # Add /pantry and /shopping-list routes
  Layout.tsx                           # Add Pantry + Shopping List tabs to nav

src/modules/
  add-item/
    AddItemModal.tsx                   # Add AI scan button to step flow

src/shared/
  hooks/
    use-household.ts                   # NEW: shared hook to get household_id from auth context
```

### New i18n Keys (Added to All Locale Files)

```
pantry.*          # Pantry page, item list, add/edit modals
scanner.*         # Barcode scanner UI strings
recipes.*         # Recipe book, add/edit, matching, unused ingredients
shoppingList.*    # Shopping list page, add modal, generate from recipe
ai.*              # AI scan/generate UI strings, loading states, errors
categories.*      # New category labels (condiment, spice, beverage, etc.)
```

---

## 5. Navigation Changes

### Mobile Bottom Tab Bar (4 tabs + center FAB)

```
[Fridge]  [Pantry]  (+)  [Shopping]  [Stats]
```

| Tab | Icon | Route | Label i18n key |
|---|---|---|---|
| Fridge | `Refrigerator` | `/` | `dashboard.title` |
| Pantry | `ShoppingBasket` | `/pantry` | `pantry.title` |
| **Center FAB** | `Plus` | — | Context-sensitive (opens add modal for current page) |
| Shopping | `ListChecks` | `/shopping-list` | `shoppingList.title` |
| Stats | `BarChart3` | `/stats` | `stats.title` |

### Context-Sensitive FAB

The center `+` button adapts based on the current route:
- `/` (Fridge) → Opens `AddItemModal` (leftover)
- `/pantry` → Opens `AddPantryItemModal`
- `/shopping-list` → Opens `AddShoppingItemModal`
- `/stats` → Opens `AddItemModal` (default fallback)

### Desktop Sidebar

Same 4 entries as mobile, plus the context-sensitive add button.

### Pantry Page Sub-Tabs

Inside `/pantry`, a segmented control switches between:
- **Items** — Pantry inventory list
- **Recipes** — Curated recipe book with matching indicators

The segmented control uses `framer-motion layoutId` for smooth tab indicator transitions.

---

## 6. API Integration Details

### 6a. Open Food Facts (Barcode Lookup)

```
GET https://{locale}.openfoodfacts.org/api/v2/product/{barcode}.json
    ?fields=product_name,brands,categories_tags,image_front_url,quantity
```

**Locale mapping:**
| i18n locale | OFF subdomain |
|---|---|
| `en` | `world` |
| `sv` | `se` |
| `de` | `de` |
| `fr` | `fr` |
| `es` | `es` |
| `it` | `it` |
| `ru` | `ru` |
| Others | `world` |

**Response handling:**
- `status: 1` → product found, extract `product_name`, `brands`, `image_front_url`
- `status: 0` → product not found, fall back to manual entry with barcode pre-filled
- Map `categories_tags` to app categories using a keyword lookup table

**Error handling:**
- Network error → show inline error, offer retry or manual entry
- Rate limit → unlikely (OFF is very generous), but handle 429 gracefully

### 6b. Gemini 3.1 Flash Lite (AI)

**Base URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite`

**Authentication:** `?key=${VITE_GEMINI_KEY}` query parameter

#### Use Case 1: Photo → Item Identification (Leftovers & Pantry)

```
POST :generateContent
{
  "contents": [{
    "parts": [
      { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } },
      { "text": "Identify the food item in this photo. Respond with JSON only:
        { \"name\": \"...\", \"category\": \"...\", \"estimated_expiry_days\": N }.
        Categories must be one of: meat, poultry, seafood, veg, dairy, grains,
        prepared, other, condiment, spice, beverage, frozen, baking, canned." }
    ]
  }],
  "generationConfig": { "responseMimeType": "application/json" }
}
```

#### Use Case 2: Recipe Parsing (URL → Structured Recipe)

```
POST :generateContent
{
  "contents": [{
    "parts": [
      { "text": "Extract the recipe from this URL: <url>. Respond with JSON only:
        { \"title\": \"...\", \"description\": \"...\", \"servings\": N,
          \"prep_time\": N, \"cook_time\": N,
          \"ingredients\": [{ \"name\": \"...\", \"quantity\": N, \"unit\": \"...\", \"optional\": false }],
          \"instructions\": \"...\" }.
        Return ingredient quantities as numbers. Use metric units when possible." }
    ]
  }],
  "generationConfig": { "responseMimeType": "application/json" }
}
```

**Note:** Gemini can access public URLs directly. For private/paywalled content, the user pastes recipe text manually.

#### Use Case 3: Recipe Parsing (Image → Structured Recipe)

Same as Use Case 2 but with `inlineData` image instead of URL text. For cookbook photos or screenshots.

#### Use Case 4: Recipe Parsing (Pasted Text → Structured Recipe)

Same structure — plain text input, same JSON output schema.

#### Use Case 5: Generate Recipe from Pantry

```
POST :generateContent
{
  "contents": [{
    "parts": [
      { "text": "I have these ingredients in my pantry: <comma-separated list>.
        Create ONE recipe using ONLY these ingredients (plus basic staples like
        salt, pepper, oil, water). Respond with JSON only:
        { \"title\": \"...\", \"description\": \"...\", \"servings\": N,
          \"prep_time\": N, \"cook_time\": N,
          \"ingredients\": [{ \"name\": \"...\", \"quantity\": N, \"unit\": \"...\", \"optional\": false }],
          \"instructions\": \"step-by-step instructions\" }" }
    ]
  }],
  "generationConfig": { "responseMimeType": "application/json" }
}
```

#### Response Parsing & Validation

All Gemini responses pass through a validation layer:
1. Parse JSON from response
2. Validate against expected TypeScript types using runtime checks
3. Normalize ingredient names (lowercase, trim, basic singularization)
4. If parsing fails → show user-friendly error, offer manual entry fallback

#### Rate Limiting (Per-Household)

- 500 requests/day global free tier limit
- **Per-household limits** (configurable via constants):
  - `GEMINI_DAILY_LIMIT = 100` — Gemini requests per household per day
  - `SPOONACULAR_DAILY_LIMIT = 20` — Spoonacular requests per household per day (reserved for future)
- Track usage client-side with `localStorage` keyed by `household_id` + date
- Show "AI quota reached" message when limit hit; degrade gracefully to manual flows
- Constants stored in `src/modules/ai/rate-limits.ts` for easy adjustment
- All AI features have a manual fallback path

### 6c. Spoonacular (Optional — Reserved for Future)

Not used in V2 core. The `VITE_SPOONACULAR_KEY` is configured for a potential future "Discover recipes" feature. The core experience uses only user-curated recipes.

---

## 7. Recipe Matching Algorithm

### Core Logic (`recipe-matching.ts`)

```typescript
type MatchResult = {
  recipe: RecipeRecord;
  ingredients: RecipeIngredientRecord[];
  matched: string[];       // Ingredient names found in pantry
  missing: string[];       // Ingredient names NOT in pantry
  matchRatio: number;      // 0.0 - 1.0
  canMake: boolean;        // All required ingredients available
};

function matchRecipesToPantry(
  recipes: RecipeWithIngredients[],
  pantryItems: PantryItemRecord[],
): MatchResult[]
```

### Matching Steps

1. **Normalize pantry names:** lowercase, trim, remove plurals (basic English singularization)
2. **Build pantry set:** `Set<string>` of normalized pantry item names (only `in_stock` or `low` status)
3. **For each recipe:**
   - Get all `recipe_ingredients` for this recipe
   - Split into `required` (where `optional = false`) and `optional`
   - For each required ingredient, check if `name_normalized` exists in pantry set
   - `canMake = all required ingredients matched`
   - `matchRatio = matched.length / required.length`
4. **Sort results:**
   - First: `canMake = true` (fully cookable) sorted by total ingredients descending
   - Then: by `matchRatio` descending (closest to fully cookable)
   - Finally: by `missing.length` ascending

### Ingredient Normalization (`name_normalized` field)

When saving a recipe ingredient, the `name_normalized` field is computed:
1. Lowercase
2. Trim whitespace
3. Remove common suffixes: "s", "es", "ies" → "y"
4. Strip adjectives: "fresh", "dried", "canned", "frozen", "chopped", "diced", "sliced", "minced"
5. Strip parenthetical notes: "(optional)", "(to taste)"

This allows "Fresh Tomatoes" to match pantry item "Tomato" and "Diced chicken breast" to match "Chicken".

### Unused Ingredients

```typescript
function findUnusedPantryItems(
  pantryItems: PantryItemRecord[],
  allRecipeIngredients: RecipeIngredientRecord[],
): PantryItemRecord[]
```

Returns pantry items whose normalized name does not appear in any recipe ingredient's `name_normalized`.

---

## 8. Shopping List Logic

### Auto-Generate from Recipe

1. User selects a recipe from the recipe list
2. System loads recipe's `recipe_ingredients`
3. For each ingredient, check against pantry (using same normalization):
   - If pantry has it (`in_stock` or `low`) → skip (or optionally mark as "already have")
   - If pantry doesn't have it → add to shopping list
4. Each generated item stores `recipe_id` reference for grouping display

### Manual Addition

User can add freeform items with optional quantity/unit. No recipe reference.

### Check-Off Flow

- Tap item → toggle `checked` field
- Checked items move to bottom of list with strikethrough styling
- Optional: "Clear checked items" bulk action (deletes all checked)
- Optional: "Add checked to pantry" action → creates pantry items from checked shopping list entries

### Display

- Group by recipe (if `recipe_id` set) with recipe title as section header
- Manual items in their own "Other" section
- Each item shows quantity, unit, name
- Swipe-to-check on mobile (reuse `@use-gesture/react` pattern from leftover cards)

---

## 9. Gemini AI UX Flows

### 9a. Leftover Add (Modified AddItemModal)

**Current flow:** Name → Category → Photo → Notes (4 steps)

**New flow with AI option:**
- Step 0 (**new**): Method picker — "Manual" or "AI Scan"
  - If "Manual" → existing 4-step flow unchanged
  - If "AI Scan" → Camera opens → capture photo → send to Gemini → auto-fill all fields → user reviews pre-filled form → Save

**AI Scan sub-flow:**
1. Camera view with "Take Photo" button (reuse `CameraCapture` component)
2. Photo captured → show loading spinner with "Identifying..."
3. Gemini response → pre-fill: `item_name`, `category`, `expiry_date` (based on `estimated_expiry_days`)
4. Show single review form with all fields editable
5. User adjusts if needed → Save

**Fallback:** If Gemini fails → show error inline, transition to manual flow with photo already attached.

### 9b. Pantry Add (AddPantryItemModal)

**Three entry methods (step 0):**
1. **"Scan Barcode"** → Camera opens → `html5-qrcode` detects barcode → OFF API lookup → auto-fill form
2. **"AI Scan"** → Camera opens → capture photo → Gemini identifies → auto-fill form
3. **"Add Manually"** → standard form

**Barcode scan sub-flow:**
1. `BarcodeScanner` component renders camera feed
2. On barcode detection → dismiss scanner → call OFF API
3. If product found → pre-fill name, category (mapped from OFF tags), photo (from OFF image URL)
4. If barcode already in pantry → offer to increment quantity instead
5. If product not found → show "Product not found" → fall through to manual with barcode pre-filled
6. User reviews form → set quantity/unit → Save

**AI Scan sub-flow:**
Same as leftover AI scan but optimized for packaged products:
- Prompt asks for: name, category, typical shelf life
- Pre-fills form with results
- Quantity defaults to 1

### 9c. Recipe Add (AddRecipeModal)

**Four entry methods (step 0):**
1. **"From URL"** → Paste URL → Gemini extracts recipe → user reviews structured form → Save
2. **"From Photo"** → Camera or upload photo of recipe (cookbook page, screenshot) → Gemini extracts → review → Save
3. **"Paste Text"** → Paste recipe text → Gemini structures it → review → Save
4. **"Manual"** → Full manual entry form

**All AI paths converge on the same review form:**
- Title (editable)
- Description (editable)
- Servings, prep time, cook time (editable)
- Ingredients list (add/remove/edit individual ingredients)
- Instructions (editable, supports line breaks)
- Source URL (auto-filled for URL import)
- Photo (from AI or manual upload)
- Tags (editable)

### 9d. Generate Recipe from Pantry

**Accessible from:** Pantry page → Recipes tab → "Generate with AI" button

**Flow:**
1. System gathers all `in_stock` pantry item names
2. Sends to Gemini with generation prompt
3. Shows loading state: "Creating a recipe from your pantry..."
4. Gemini returns structured recipe JSON
5. `AiRecipeGenerateModal` shows the generated recipe in full review form
6. User can edit any field before saving
7. Save → creates `recipe` + `recipe_ingredients` records

---

## 10. Implementation Phases

### Phase 1: Database Schema & Shared Utilities

**Migration file:** `pb_migrations/003_pantry_recipes_shopping.js`

**Tasks:**
- [ ] Create `pantry_items` collection with all fields and access rules
- [ ] Create `recipes` collection with all fields and access rules
- [ ] Create `recipe_ingredients` collection with cascade delete on recipe
- [ ] Create `shopping_list_items` collection with all fields and access rules
- [ ] Add expanded category type to shared `pantry-categories.ts`
- [ ] Create `src/shared/hooks/use-household.ts` to extract household_id from auth

**Files created/modified:**
```
pb_migrations/003_pantry_recipes_shopping.js     (new)
src/modules/pantry/pantry-categories.ts          (new)
src/shared/hooks/use-household.ts                (new)
```

### Phase 2: Pantry CRUD & Manual Add

**Tasks:**
- [ ] `pantry-api.ts` — CRUD functions: list (by status), create, update, delete
- [ ] `use-pantry.ts` — React Query hooks wrapping API, optimistic updates for quantity changes
- [ ] `PantryItemCard.tsx` — Card component showing name, category icon, quantity badge, expiry indicator
- [ ] `PantryItemList.tsx` — Filterable list (all / in_stock / low / finished) with staggered animation
- [ ] `AddPantryItemModal.tsx` — Method picker (scan/AI/manual) → multi-step form → save
- [ ] `EditPantryItemModal.tsx` — Edit form for existing pantry item
- [ ] `PantryPage.tsx` — Container with segmented tabs (Items / Recipes)
- [ ] Add `/pantry` route to `Router.tsx`
- [ ] Add Pantry tab to `Layout.tsx` (mobile + desktop nav)
- [ ] Add i18n keys for `pantry.*` namespace

**Files created/modified:**
```
src/modules/pantry/pantry-api.ts                 (new)
src/modules/pantry/use-pantry.ts                 (new)
src/modules/pantry/PantryPage.tsx                (new)
src/modules/pantry/items/PantryItemCard.tsx      (new)
src/modules/pantry/items/PantryItemList.tsx      (new)
src/modules/pantry/items/AddPantryItemModal.tsx  (new)
src/modules/pantry/items/EditPantryItemModal.tsx (new)
src/app/Router.tsx                               (modified)
src/app/Layout.tsx                               (modified)
public/locales/en/translation.json               (modified — add pantry.* keys)
public/locales/{all others}/translation.json     (modified)
```

### Phase 3: Barcode Scanner & Open Food Facts

**Tasks:**
- [ ] `BarcodeScanner.tsx` — `html5-qrcode` wrapper: camera permissions, real-time scanning, detection callback
- [ ] `open-food-facts-api.ts` — REST client with locale routing, response mapping to app types
- [ ] `use-scanner.ts` — Hook composing scanner + lookup: `scan → barcode → OFF → product data`
- [ ] Integrate scanner into `AddPantryItemModal.tsx` "Scan Barcode" path
- [ ] Barcode dedup: check existing pantry items, offer increment if match
- [ ] Add i18n keys for `scanner.*` namespace

**Files created/modified:**
```
src/modules/pantry/scanner/BarcodeScanner.tsx      (new)
src/modules/pantry/scanner/open-food-facts-api.ts  (new)
src/modules/pantry/scanner/use-scanner.ts          (new)
src/modules/pantry/items/AddPantryItemModal.tsx     (modified — integrate scanner path)
public/locales/en/translation.json                  (modified — add scanner.* keys)
public/locales/{all others}/translation.json        (modified)
```

### Phase 4: Recipe Book CRUD

**Tasks:**
- [ ] `recipe-api.ts` — CRUD for recipes + recipe_ingredients (batch create/update ingredients with recipe)
- [ ] `use-recipes.ts` — React Query hooks: list recipes, get single recipe with ingredients, create, update, delete
- [ ] `RecipeCard.tsx` — Card showing title, photo, servings, prep+cook time, tags
- [ ] `RecipeList.tsx` — Recipe grid/list inside Pantry page's "Recipes" tab
- [ ] `RecipeDetailModal.tsx` — Full recipe view: ingredients list, instructions, source link, edit/delete actions
- [ ] `AddRecipeModal.tsx` — Method picker (URL/photo/text/manual) → form → ingredients editor → instructions → save
- [ ] `EditRecipeModal.tsx` — Edit existing recipe (title, ingredients, instructions, etc.)
- [ ] Add i18n keys for `recipes.*` namespace

**Files created/modified:**
```
src/modules/pantry/recipes/recipe-api.ts            (new)
src/modules/pantry/recipes/use-recipes.ts           (new)
src/modules/pantry/recipes/RecipeCard.tsx            (new)
src/modules/pantry/recipes/RecipeList.tsx            (new)
src/modules/pantry/recipes/RecipeDetailModal.tsx     (new)
src/modules/pantry/recipes/AddRecipeModal.tsx        (new)
src/modules/pantry/recipes/EditRecipeModal.tsx       (new)
src/modules/pantry/PantryPage.tsx                    (modified — wire Recipes tab)
public/locales/en/translation.json                   (modified — add recipes.* keys)
public/locales/{all others}/translation.json         (modified)
```

### Phase 5: Recipe Matching & Unused Ingredients

**Tasks:**
- [ ] `recipe-matching.ts` — Matching algorithm: normalize names, build pantry set, compute match results, sort
- [ ] Ingredient normalization utility: lowercase, trim, strip adjectives/suffixes
- [ ] Update `RecipeList.tsx` — Add "Can make" / "Missing N" badge to each recipe card
- [ ] Add filter toggle: "Show cookable only" / "Show all"
- [ ] `UnusedIngredients.tsx` — List pantry items not referenced in any recipe, with "find a recipe" CTA
- [ ] Wire unused ingredients into Pantry page (section at bottom of Items tab)

**Files created/modified:**
```
src/modules/pantry/recipes/recipe-matching.ts        (new)
src/modules/pantry/recipes/RecipeList.tsx             (modified — add match badges)
src/modules/pantry/recipes/RecipeCard.tsx             (modified — accept match data)
src/modules/pantry/recipes/UnusedIngredients.tsx      (new)
src/modules/pantry/PantryPage.tsx                     (modified — wire unused section)
```

### Phase 6: Shopping List

**Tasks:**
- [ ] `shopping-list-api.ts` — CRUD for shopping_list_items
- [ ] `use-shopping-list.ts` — React Query hooks: list, create, toggle check, delete, bulk clear
- [ ] `ShoppingListPage.tsx` — Main view grouped by recipe, swipe-to-check, "clear checked" action
- [ ] `ShoppingListItem.tsx` — Individual item with check animation and swipe gesture
- [ ] `AddShoppingItemModal.tsx` — Quick add form (name, quantity, unit)
- [ ] `GenerateFromRecipeModal.tsx` — Select recipe → show missing ingredients → confirm → add to list
- [ ] Add `/shopping-list` route to `Router.tsx`
- [ ] Add Shopping List tab to `Layout.tsx`
- [ ] Update FAB context logic in `Layout.tsx`
- [ ] Add i18n keys for `shoppingList.*` namespace

**Files created/modified:**
```
src/modules/shopping-list/shopping-list-api.ts         (new)
src/modules/shopping-list/use-shopping-list.ts         (new)
src/modules/shopping-list/ShoppingListPage.tsx         (new)
src/modules/shopping-list/ShoppingListItem.tsx         (new)
src/modules/shopping-list/AddShoppingItemModal.tsx     (new)
src/modules/shopping-list/GenerateFromRecipeModal.tsx  (new)
src/app/Router.tsx                                      (modified)
src/app/Layout.tsx                                      (modified)
public/locales/en/translation.json                      (modified)
public/locales/{all others}/translation.json            (modified)
```

### Phase 7: Gemini AI Integration

**Tasks:**
- [ ] `gemini-api.ts` — REST client: `generateContent` wrapper, image to base64, JSON parser, daily rate tracking
- [ ] `use-ai-identify.ts` — Hook: photo blob → compress → Gemini → identified item data
- [ ] `use-ai-recipe-parse.ts` — Hook: URL/text/image → Gemini → structured recipe data
- [ ] `use-ai-recipe-generate.ts` — Hook: pantry item list → Gemini → generated recipe
- [ ] `AiScanButton.tsx` — Reusable "sparkle" AI button with loading state
- [ ] `AiRecipeGenerateModal.tsx` — Full review modal for AI-generated recipes before saving
- [ ] Integrate AI identify into `AddItemModal.tsx` (leftover) — add method picker step
- [ ] Integrate AI identify into `AddPantryItemModal.tsx` — wire "AI Scan" path
- [ ] Integrate AI recipe parsing into `AddRecipeModal.tsx` — wire URL/photo/text paths
- [ ] Integrate recipe generation into `PantryPage.tsx` recipes tab
- [ ] Add i18n keys for `ai.*` namespace
- [ ] Add `.env` variables documentation in `.env.example`

**Files created/modified:**
```
src/modules/ai/gemini-api.ts                         (new)
src/modules/ai/use-ai-identify.ts                    (new)
src/modules/ai/use-ai-recipe-parse.ts                (new)
src/modules/ai/use-ai-recipe-generate.ts             (new)
src/modules/ai/AiScanButton.tsx                      (new)
src/modules/ai/AiRecipeGenerateModal.tsx             (new)
src/modules/add-item/AddItemModal.tsx                (modified)
src/modules/pantry/items/AddPantryItemModal.tsx      (modified)
src/modules/pantry/recipes/AddRecipeModal.tsx        (modified)
src/modules/pantry/PantryPage.tsx                    (modified)
.env.example                                         (modified)
public/locales/en/translation.json                    (modified)
public/locales/{all others}/translation.json          (modified)
```

### Phase 8: i18n & Polish

**Tasks:**
- [ ] Translate all new keys across all 11 locale files (en, sv, de, fr, es, it, ru, tl, ceb, mni, mni-Mtei)
- [ ] Empty states for pantry (no items), recipes (no recipes saved), shopping list (all done)
- [ ] Loading skeletons for pantry list, recipe list, shopping list
- [ ] Error states with retry buttons
- [ ] Responsive polish: desktop sidebar layout, tablet breakpoints
- [ ] Staggered list animations on all new list views
- [ ] Tab transition animations (layoutId on segmented control)
- [ ] Dark mode verification for all new components
- [ ] Mobile safe-area spacing for all new pages
- [ ] Tactile feedback (`active:scale-[0.98]`) on all interactive elements

**Files modified:**
```
public/locales/*/translation.json                     (all 11 locales)
All new components                                     (polish pass)
```

### Phase 9: Container & Deployment Updates

**Tasks:**
- [ ] Update `Dockerfile` to pass new build args (`VITE_GEMINI_KEY`, `VITE_SPOONACULAR_KEY`)
- [ ] Update `podman-compose.yml` with new env vars
- [ ] Update `.env.example` with all new variables documented
- [ ] Test migration runs cleanly on fresh PocketBase instance
- [ ] Test barcode scanner on mobile over HTTPS
- [ ] Test Gemini API integration end-to-end
- [ ] Verify all new routes work with nginx config (SPA fallback)

**Files modified:**
```
Dockerfile                                             (modified)
podman-compose.yml                                     (modified)
.env.example                                           (modified)
```

---

## 11. Environment Variables (Complete)

```bash
# Existing
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com

# New — V2
VITE_GEMINI_KEY=                    # Gemini API key (free tier, 500 req/day)
VITE_SPOONACULAR_KEY=               # Spoonacular API key (free tier, 150 req/day) — reserved for future
```

---

## 12. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Gemini rate limit (500/day global, 100/household) | Per-household daily counter in localStorage; configurable constants; all AI paths have manual fallback |
| OFF product not found | Graceful fallback to manual entry with barcode pre-filled |
| Camera permission denied | File upload fallback (already implemented in CameraCapture) |
| Ingredient matching inaccuracy | `name_normalized` field + progressive improvement via Gemini normalization |
| Large recipe_ingredients table | Cascade delete on recipe removal; indexed on `recipe_id` |
| Mobile performance (many pantry items) | Virtualized lists if >100 items; paginated PocketBase queries |
| Gemini returns invalid JSON | Strict validation layer + user-friendly error with manual fallback |
| HTTPS requirement for camera | Already satisfied (Cloudflare Tunnel); localhost works for dev |

---

## 13. Dependency Summary (Final V2)

```bash
# Existing (no changes)
react react-dom react-router-dom
@tanstack/react-query
framer-motion
@use-gesture/react
i18next react-i18next
lucide-react
pocketbase
tailwindcss
vite @vitejs/plugin-react typescript

# New
html5-qrcode                        # Barcode scanning via device camera
```

No additional runtime dependencies for Gemini or Open Food Facts (plain `fetch` calls).