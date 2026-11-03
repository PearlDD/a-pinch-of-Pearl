import soup from './fixtures/lemonOrzoSoup.json';
import { calculateNutrition } from '../nutritionCalculator';
import { parseIngredientLine } from '../ingredientQuantity';
const estimate = { estimateMissing: true };

it('calculates every ingredient of the screenshot soup, not a partial total', () => {
  const result = calculateNutrition(soup.ingredients, 6, estimate);
  expect(result).toMatchObject({ complete: true, total: 14, matched: 14, quantified: 14 });
  expect(result.ingredients.every(item => item.issues.length === 0)).toBe(true);
  expect(result.ingredients[0]).toMatchObject({ food: 'celery', grams: 80, estimated: true });
  expect(result.ingredients[9].food).toBe('raw chicken breast');
  expect(result.ingredients[9].grams).toBeCloseTo(680.4);
  expect(result.ingredients[10]).toMatchObject({ food: 'dry orzo', grams: 252, estimated: true });
  expect(result.ingredients[13].notes.join(' ')).toContain('0.5 g pinch salt');
  for (const value of [result.calories, result.protein, result.carbs, result.fat, result.fiber]) expect(value).not.toBe('');
});

it('divides whole-recipe nutrients once by the current servings, including fractional servings', () => {
  const whole = calculateNutrition(soup.ingredients, 1, estimate);
  const perServing = calculateNutrition(soup.ingredients, 6, estimate);
  const fractional = calculateNutrition(soup.ingredients, 2.5, estimate);
  for (const key of ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const) {
    const value = (text: string) => parseFloat(text.replace('~', ''));
    const tolerance = key === 'calories' ? 1 : 0.11;
    expect(Math.abs(value(perServing[key]) - value(whole[key]) / 6)).toBeLessThan(tolerance);
    expect(Math.abs(value(fractional[key]) - value(whole[key]) / 2.5)).toBeLessThan(tolerance);
  }
});

it.each(['1.5 pounds uncooked chicken breasts', '1.5 lb raw chicken breast', '680.4g chicken breast raw'])('retains the raw preparation state: %s', line => {
  const result = calculateNutrition([line], 1, estimate);
  expect(result.complete).toBe(true);
  expect(result.ingredients[0].food).toBe('raw chicken breast');
  expect(result.ingredients[0].grams).toBeCloseTo(680.4);
  expect(result.protein).toBe('153.1g'); // USDA raw 22.5 g/100 g, not cooked 31 g/100 g
});

it('keeps cooked/raw chicken and cooked/dry pasta separate', () => {
  expect(calculateNutrition(['100g raw chicken breast'], 1).protein).toBe('22.5g');
  expect(calculateNutrition(['100g cooked chicken breast'], 1).protein).toBe('31g');
  expect(calculateNutrition(['100g dry orzo'], 1).calories).toBe('~371 kcal');
  expect(calculateNutrition(['100g cooked orzo'], 1).calories).toBe('~158 kcal');
  expect(calculateNutrition(['1 cup cooked orzo'], 1, estimate).ingredients[0].grams).toBe(140);
});

it.each(['1/4 teaspoon Italian seasoning', 'Salt & pepper (to taste)', '2 sticks celery (chopped finely)'])('estimates common culinary wording: %s', line => {
  const result = calculateNutrition([line], 1, estimate);
  expect(result.complete).toBe(true);
  expect(result.ingredients[0].estimated).toBe(true);
  expect(result.ingredients[0].notes.length).toBeGreaterThan(0);
});

it('recalculates the actual edited soup and restores unchanged results deterministically', () => {
  const original = calculateNutrition(soup.ingredients, 6, estimate);
  const lines = [...soup.ingredients]; lines[10] = '2 cups uncooked orzo';
  const changed = calculateNutrition(lines, 6, estimate);
  expect(parseFloat(changed.carbs)).toBeGreaterThan(parseFloat(original.carbs));
  lines.push('1 tablespoon olive oil');
  expect(parseFloat(calculateNutrition(lines, 6, estimate).fat)).toBeGreaterThan(parseFloat(changed.fat));
  lines.pop(); lines[10] = soup.ingredients[10];
  expect(calculateNutrition(lines, 6, estimate)).toEqual(original);
});

it('keeps strict mode and invalid values distinct from successful estimates', () => {
  expect(calculateNutrition(['orzo'], 1).complete).toBe(false);
  expect(calculateNutrition(['1 tsb black pepper'], 1).complete).toBe(false);
  expect(calculateNutrition(['1 tsb black pepper'], 1, estimate).ingredients[0].notes.join(' ')).toContain('Interpreting ambiguous tsb');
  for (const line of ['-1 cup orzo', '1/0 cup orzo', '1 cup xyzfood', '100g pasta water', '100g chickpea orzo', '100g chicken-style vegan strips']) expect(calculateNutrition([line], 1, estimate).complete).toBe(false);
});

it('includes all measured components in a row, while preserving source-row matching counts', () => {
  const result = calculateNutrition(['1 tbsp flour and 1 tbsp sugar'], 1, estimate);
  expect(result).toMatchObject({ complete: true, total: 1, matched: 1, quantified: 1, calories: '~78 kcal' });
  expect(result.ingredients[0].notes.join(' ')).toContain('each explicitly measured component');
  expect(calculateNutrition(['100g flour and 10g xyzfood'], 1, estimate).calories).toBe('');
});

it('does not lose food names to commas inside a parenthetical preparation note', () => {
  expect(parseIngredientLine('Lamb rack: 1-1.5lb (high-quality ones, otherwise it will taste gamey)').food).toBe('lamb rack');
  const carrots = calculateNutrition(['Colorful carrot bunch: 1-2 bunches (rice and carrot ratio 1lb:1lb, cut into strips)'], 1, estimate);
  expect(carrots.ingredients[0].grams).toBe(630);
});

it('uses explicit package weights instead of assumed package sizes', () => {
  expect(calculateNutrition(['1 block (500g edible) firm tofu'], 1, estimate).ingredients[0].grams).toBe(500);
  expect(calculateNutrition(['1 block firm tofu'], 1, estimate).ingredients[0]).toMatchObject({ grams: 350, estimated: true });
});

it('labels a different-brand product proxy and preserves reduced-fat composition', () => {
  const result = calculateNutrition(["150g Trader Joe's reduced-fat coconut milk"], 1, estimate);
  expect(result.complete).toBe(true);
  expect(result.ingredients[0]).toMatchObject({ food: 'light coconut milk', estimated: true });
  expect(result.ingredients[0].notes.join(' ')).toContain('not a verified label');
  expect(parseFloat(result.fat)).toBeLessThan(parseFloat(calculateNutrition(['150g coconut milk'], 1).fat));
  expect(calculateNutrition(["150g Trader Joe's reduced-fat coconut milk"], 1).complete).toBe(false);
});

it('excludes equipment while retaining the original text for review', () => {
  const result = calculateNutrition(['100g flour', 'A pot/wok with a lid'], 1, estimate);
  expect(result).toMatchObject({ complete: true, calories: '~364 kcal', total: 1, ignoredLines: ['A pot/wok with a lid'] });
});


it('identifies wrapper preparation instructions but still requires actual main filling choices', () => {
  const wrappers = calculateNutrition(['Dumpling Wrappers: make your own or buy pre-made (available at Chinese markets)'], 1, estimate);
  expect(wrappers).toMatchObject({ complete: true, matched: 1, quantified: 1 });
  expect(wrappers.ingredients[0]).toMatchObject({ food: 'dumpling wrappers', grams: 55, estimated: true });
  const unspecified = calculateNutrition(['Filling: combination of meat (pork, beef, or shrimp) and vegetables (cabbage, chives, corn)'], 1, estimate);
  expect(unspecified.complete).toBe(false);
  expect(unspecified.ingredients[0].issues.join(' ')).toContain('actual main ingredients');
});
