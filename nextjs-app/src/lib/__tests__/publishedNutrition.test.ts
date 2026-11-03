import fixtures from './fixtures/publishedRecipes.json';
import { calculateNutrition, resolveNutritionServings } from '../nutritionCalculator';
import { parseIngredientLine } from '../ingredientQuantity';
import { isNutritionExcludedLine } from '../nutritionText';

// Public ingredient text captured 2026-11-02; no credentials/database writes.
const supported = fixtures.filter(recipe => !['Dumplings', 'Lu Wei (Chinese Braising Dish)'].includes(recipe.name)).map(recipe => recipe.name);
it.each(fixtures)('audits the full current ingredient list: $name', recipe => {
  const count = resolveNutritionServings(recipe.servings, true).count;
  const lines = recipe.ingredients.split('\n');
  const before = [...lines];
  const result = calculateNutrition(lines, count, { estimateMissing: true });
  expect(lines).toEqual(before);
  expect(result.total + result.ignoredLines.length).toBe(lines.filter(line => line.trim()).length);
  expect(result.ingredients.map(item => item.line)).toEqual(lines.filter(line => line.trim() && !isNutritionExcludedLine(line)));
  expect(calculateNutrition([...lines], count, { estimateMissing: true })).toEqual(result);
  if (supported.includes(recipe.name)) expect(result.complete).toBe(true);
  if (result.complete) {
    for (const key of ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const) expect(Number.isFinite(parseFloat(result[key].replace('~', '')))).toBe(true);
    for (const item of result.ingredients.filter(item => item.estimated)) expect(item.notes.length).toBeGreaterThan(0);
  } else {
    expect(result.ingredients.some(item => item.issues.length)).toBe(true);
    for (const key of ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const) expect(result[key]).toBe('');
  }
});

it('uses food-specific portions for the exact published tuna recipe, retaining fractional quantities', () => {
  const recipe = fixtures.find(item => item.name === 'Spaghetti with Tuna')!;
  const result = calculateNutrition(recipe.ingredients.split('\n'), 1, { estimateMissing: true });
  expect(result).toMatchObject({ matched: 9, quantified: 9, complete: true, estimated: 9 });
  expect(result.ingredients[0]).toMatchObject({ food: 'dry pasta', grams: 55, estimated: true });
  expect(result.ingredients[2].grams).toBe(8);
  expect(result.ingredients[7].grams).toBe(113 / 4);
  expect(result.ingredients[7].notes.join(' ')).toContain('assuming 113 g drained');
  const updated = recipe.ingredients.split('\n'); updated[0] = '110g dry spaghetti';
  expect(parseFloat(calculateNutrition(updated, 1, { estimateMissing: true }).protein)).toBeGreaterThan(parseFloat(result.protein));
  expect(calculateNutrition(recipe.ingredients.split('\n'), 1).complete).toBe(false);
});

it.each([
  ['1 egg yolk', 17], ['5 egg whites', 165], ['2 tsp vanilla extract', 8.4],
  ['1 tbsp chia seeds', 13], ['1/2 tsp baking soda', 2.3], ['1 tbsp capers, chopped', 8.6],
  ['Shrimp: 2 lb, chopped', 907.2], ['Corn: 1 lb', 453.6], ['Garlic: 3 cloves, minced', 9],
  ['Red Onion: 1', 110], ['Green onion: 2, chopped', 30],
  ['牛肉100克', 100], ['100克牛肉', 100], ['白洋葱 半个', 75], ['蛋白三十三克', 33],
  ['¼ cup + 2½ tablespoons flour', 97.5 * 0.53],
] as const)('resolves %s with a specific amount/reference', (line, grams) => {
  const result = calculateNutrition([line], 1, { estimateMissing: true });
  expect(result.complete).toBe(true);
  expect(result.ingredients[0].grams).toBeCloseTo(grams);
});

it('does not double count a parenthetical equivalent or confuse package size with total weight', () => {
  expect(calculateNutrition(['115g sugar (½ cup + 1 tbsp)'], 1).ingredients[0].grams).toBe(115);
  expect(calculateNutrition(['⅓ (14 oz) can sweetened condensed milk (~4.67 oz)'], 1, { estimateMissing: true }).ingredients[0].grams).toBeCloseTo(14 * 28.35 / 3);
});

it('distinguishes strict quantities from explicitly selected standard-portion estimates', () => {
  expect(calculateNutrition(['1 portion spaghetti'], 1).complete).toBe(false);
  const result = calculateNutrition(['spaghetti', 'minced fresh parsley'], 1, { estimateMissing: true });
  expect(result.complete).toBe(true);
  expect(result.estimated).toBe(2);
  expect(calculateNutrition(['milk'], 1, { estimateMissing: true }).ingredients[0].grams).toBe(240);
  expect(calculateNutrition(['cooked white rice'], 1, { estimateMissing: true }).ingredients[0].grams).toBe(140);
  expect(result.ingredients[0].notes.join(' ')).toContain('55 g');
  expect(calculateNutrition(['4-5 cloves garlic'], 1, { estimateMissing: true }).ingredients[0].grams).toBe(13.5);
  expect(calculateNutrition(['-5g garlic'], 1, { estimateMissing: true }).complete).toBe(false);
  expect(calculateNutrition(['1/0g garlic'], 1, { estimateMissing: true }).complete).toBe(false);
});

it('keeps unsupported foods visible instead of assigning zero or generic 100 g', () => {
  for (const line of ['1 bowl xyzfood', '100g pasta water', '100g spaghetti squash']) {
    expect(calculateNutrition([line], 1, { estimateMissing: true })).toMatchObject({ complete: false, calories: '' });
  }
});

it('handles serving ranges only as labelled estimates and never masks invalid servings', () => {
  expect(resolveNutritionServings('2 to 3', true)).toMatchObject({ count: 2.5, note: expect.stringContaining('midpoint') });
  expect(() => resolveNutritionServings('2 to 3', false)).toThrow();
  for (const value of ['0-3', '3-2', '-2']) expect(() => resolveNutritionServings(value, true)).toThrow();
});

it('does not lose Chinese ranges, decimals, units or teen quantities', () => {
  expect(parseIngredientLine('大蒜 2 到 3 头，剥皮备用')).toMatchObject({ range: { min: 2, max: 3 }, unit: 'head' });
  expect(parseIngredientLine('十二克牛肉')).toMatchObject({ quantity: 12, unit: 'g', food: 'beef' });
  expect(parseIngredientLine('八角 3 个')).toMatchObject({ quantity: 3, food: 'star anise' });
  expect(parseIngredientLine('二荆条 1包')).toMatchObject({ quantity: 1, unit: 'package', food: 'dried chili pepper' });
  expect(parseIngredientLine('醋 3 勺')).toMatchObject({ quantity: 3, unit: 'spoon' });
});
