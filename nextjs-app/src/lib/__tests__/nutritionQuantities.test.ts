import { calculateNutrition, parseRecipeServings } from '../nutritionCalculator';
import { parseQuantity, parseIngredientLine } from '../ingredientQuantity';

describe('ingredient quantities', () => {
  it.each([['¼', 0.25], ['1/4', 0.25], ['1 1/2', 1.5], ['1½', 1.5], ['1⁄2', 0.5], ['.5', 0.5], ['2.75', 2.75]])('parses %s', (input, expected) => {
    expect(parseQuantity(input as string)).toBe(expected);
  });
  it.each(['1/0', '-1', 'one handful', '2-4', 'NaN', 'Infinity'])('rejects ambiguous/invalid number %s', input => {
    expect(parseQuantity(input)).toBeNull();
  });
  it.each(['¼ can tuna', '1/4 can tuna', 'a quarter of a can of tuna', 'half a can tuna'])('identifies the food but does not guess a can size: %s', input => {
    const result = calculateNutrition([input], 1);
    expect(result).toMatchObject({ matched: 1, quantified: 0, complete: false, calories: '', protein: '' });
    expect(result.ingredients[0].food).toBe('canned tuna');
    expect(result.ingredients[0].issues.join(' ')).toContain('Package sizes vary');
  });
  it.each(['¼ can (113 g drained) tuna', '1/4 of a 113 g can of tuna', '¼ can of tuna (113 g drained per can)'])('uses an explicit package weight: %s', input => {
    const result = calculateNutrition([input], 1);
    expect(result.complete).toBe(true);
    expect(result.ingredients[0].grams).toBeCloseTo(28.25);
    expect(parseFloat(result.protein)).toBeCloseTo(7.2);
  });
  it('uses explicit total package weight once, rather than multiplying it again', () => {
    const result = calculateNutrition(['2 cans tuna (226 g total drained)'], 1);
    expect(result.ingredients[0].grams).toBe(226);
  });
  it('never treats two anchovy fillets as 200 grams', () => {
    const result = calculateNutrition(['2 anchovies'], 1);
    expect(result).toMatchObject({ complete: true, estimated: 1 });
    expect(result.ingredients[0].grams).toBe(8);
    expect(parseFloat(result.protein)).toBeLessThan(3);
    expect(result.ingredients[0].notes.join(' ')).toContain('4 g per canned anchovy');
  });
  it.each(['1 portion of spaghetti', 'one portion spaghetti', 'a handful of olives', 'some capers', 'sun-dried tomatoes'])('flags an ambiguous amount: %s', line => {
    const result = calculateNutrition([line], 1);
    expect(result.complete).toBe(false);
    expect(result.calories).toBe('');
    expect(result.ingredients[0].issues.length).toBeGreaterThan(0);
  });
  it('accepts a portion with an explicit weight and preparation state', () => {
    const result = calculateNutrition(['1 portion of spaghetti (80 g dry)'], 1);
    expect(result.complete).toBe(true);
    expect(result.ingredients[0]).toMatchObject({ grams: 80, food: 'dry pasta' });
  });
  it('keeps dry, cooked, canned, ground and sun-dried foods distinct', () => {
    expect(calculateNutrition(['100g dry spaghetti'], 1).calories).toBe('~371 kcal');
    expect(calculateNutrition(['100g cooked spaghetti'], 1).calories).toBe('~158 kcal');
    expect(calculateNutrition(['100g canned tuna'], 1).protein).toBe('25.5g');
    expect(calculateNutrition(['100g ground beef'], 1).calories).toBe('~254 kcal');
    expect(calculateNutrition(['100g sun-dried tomatoes'], 1).calories).toBe('~258 kcal');
    expect(calculateNutrition(['100g dried shrimp'], 1).protein).toBe('55g');
  });
  it('requires a preparation state for an ambiguous pasta weight', () => {
    expect(calculateNutrition(['100g spaghetti'], 1).ingredients[0].issues).toContain('Specify whether the pasta amount is dry or cooked.');
  });
  it('does not match shared substrings or invented food variants', () => {
    for (const line of ['100g pasta water', '100g spaghetti squash', '100g dry spaghetti squash', '100g vegetables', '100g chicken-style vegan strips', '100g foobarflour']) {
      expect(calculateNutrition([line], 1).matched).toBe(0);
    }
  });
  it('parses mixed fractions and multiword volume units without dropping a whole number', () => {
    const one = calculateNutrition(['1 tbsp olive oil'], 1);
    const mixed = calculateNutrition(['1 1/2 tbsp olive oil'], 1);
    expect(mixed.ingredients[0].grams).toBeCloseTo(one.ingredients[0].grams! * 1.5);
    expect(calculateNutrition(['2 fluid ounces milk'], 1).ingredients[0].grams).toBe(60);
  });
  it('does not apply water density to cups of an unknown solid', () => {
    const result = calculateNutrition(['1 cup carrots'], 1);
    expect(result).toMatchObject({ matched: 1, complete: false });
    expect(result.ingredients[0].issues.join(' ')).toContain('Enter its weight in grams');
  });
  it('does not silently calculate a partial recipe with 100% food matching', () => {
    const result = calculateNutrition(['1 portion spaghetti', '¼ can tuna', '2 anchovies', '10g olives', '5g capers', '10g sun-dried tomatoes', '30g shallot', '5g parsley', '10g olive oil'], 1);
    expect(result).toMatchObject({ matched: 9, total: 9, complete: false, protein: '', calories: '' });
    expect(result.quantified).toBeLessThan(9);
  });
  it('reprocesses a mutated array, additions, removals and reordering without a cache', () => {
    const lines = ['100g flour'];
    const first = calculateNutrition(lines, 1);
    lines[0] = '200g flour';
    expect(calculateNutrition(lines, 1).calories).toBe('~728 kcal');
    lines.push('100g honey');
    const added = calculateNutrition(lines, 1);
    expect(added.calories).toBe('~1032 kcal');
    expect(calculateNutrition([...lines].reverse(), 1)).toMatchObject({ calories: added.calories, protein: added.protein, matched: 2, total: 2 });
    lines.splice(0, 1);
    expect(calculateNutrition(lines, 1)).toMatchObject({ calories: '~304 kcal', matched: 1, total: 1 });
    expect(first.calories).toBe('~364 kcal');
    expect(calculateNutrition(lines, 1)).toEqual(calculateNutrition(lines, 1));
  });
  it('includes every nonempty line, even when several lines occupy one editor row', () => {
    expect(calculateNutrition(['100g flour\n100g honey', '  '], 1)).toMatchObject({ calories: '~668 kcal', total: 2, matched: 2 });
  });
  it.each(['1/0 g flour', '-1 g flour', '1-2 tbsp oil'])('rejects invalid quantities instead of inventing defaults: %s', line => {
    expect(calculateNutrition([line], 1).complete).toBe(false);
  });
  it('accepts fractional servings and rejects invalid/ranged serving counts', () => {
    expect(parseRecipeServings('1½ servings')).toBe(1.5);
    expect(parseRecipeServings('serves 2')).toBe(2);
    expect(calculateNutrition(['100g flour'], 0.5).calories).toBe('~728 kcal');
    for (const value of ['0', '-1', '2-4', 'unknown']) expect(() => parseRecipeServings(value)).toThrow();
    expect(() => calculateNutrition(['100g flour'], Infinity)).toThrow();
    expect(() => calculateNutrition([], 1)).toThrow();
  });
  it('does not lose parenthetical weights during parsing', () => {
    expect(parseIngredientLine('2 anchovy fillets (4g each)').weight).toBe(4);
    expect(calculateNutrition(['2 anchovy fillets (4g each)'], 1).ingredients[0].grams).toBe(8);
  });
  it('accepts common food-first quantity notation', () => {
    expect(calculateNutrition(['Flour: 100g'], 1).calories).toBe('~364 kcal');
    expect(calculateNutrition(['Flour - 100g'], 1).calories).toBe('~364 kcal');
  });
  it.each(['1 can (-113g) tuna', '1 can (1/0 g) tuna', '1 can (100-200g) tuna'])('does not silently ignore an invalid package weight: %s', line => {
    expect(calculateNutrition([line], 1).complete).toBe(false);
  });
  it('identifies a food independently of a vague quantity description', () => {
    expect(calculateNutrition(['some capers'], 1)).toMatchObject({ matched: 1, quantified: 0, complete: false });
  });
  it('distinguishes package size from the weight of a fractional amount already used', () => {
    expect(calculateNutrition(['¼ can tuna (28g total drained)'], 1).ingredients[0].grams).toBe(28);
    expect(calculateNutrition(['¼ can tuna (28g used)'], 1).ingredients[0].grams).toBe(28);
    expect(calculateNutrition(['¼ can tuna (28g)'], 1).complete).toBe(false);
  });
  it('rejects numeric overflow instead of displaying infinite nutrition values', () => {
    expect(calculateNutrition([`1${'0'.repeat(308)} kg flour`], 1)).toMatchObject({ complete: false, quantified: 0, calories: '' });
    expect(() => calculateNutrition(['100g flour'], Number.MIN_VALUE)).toThrow('out of range');
  });
});
