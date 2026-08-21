import { getVolumeDensity, calculateNutrition } from '../nutritionCalculator';

describe('getVolumeDensity', () => {
  it('returns exact match density for known ingredients', () => {
    expect(getVolumeDensity('all purpose flour')).toBe(0.53);
    expect(getVolumeDensity('honey')).toBe(1.42);
    expect(getVolumeDensity('olive oil')).toBe(0.91);
    expect(getVolumeDensity('cocoa powder')).toBe(0.35);
    expect(getVolumeDensity('brown sugar')).toBe(0.92);
  });

  it('falls back to category keyword for unknown flour variants', () => {
    expect(getVolumeDensity('spelt flour')).toBe(0.53);
    expect(getVolumeDensity('buckwheat flour')).toBe(0.53);
  });

  it('falls back to category keyword for unknown starch variants', () => {
    expect(getVolumeDensity('arrowroot starch')).toBe(0.52);
  });

  it('falls back to category keyword for unknown oil variants', () => {
    expect(getVolumeDensity('grapeseed oil')).toBe(0.92);
  });

  it('falls back to category keyword for syrup variants', () => {
    expect(getVolumeDensity('golden syrup')).toBe(1.30);
  });

  it('falls back to category keyword for butter variants', () => {
    expect(getVolumeDensity('clarified butter')).toBe(0.91);
  });

  it('falls back to category keyword for oat variants', () => {
    expect(getVolumeDensity('steel cut oats')).toBe(0.37);
  });

  it('falls back to category keyword for powder (non-baking)', () => {
    expect(getVolumeDensity('garlic powder')).toBe(0.40);
  });

  it('does not apply powder fallback to baking powder', () => {
    // baking powder has an exact match at 0.92
    expect(getVolumeDensity('baking powder')).toBe(0.92);
  });

  it('returns 1.0 for completely unknown ingredients', () => {
    expect(getVolumeDensity('water')).toBe(1.0);
    expect(getVolumeDensity('chicken breast')).toBe(1.0);
    expect(getVolumeDensity('rice')).toBe(1.0);
  });
});

describe('toGrams density correction via calculateNutrition', () => {
  it('applies flour density: 1 cup flour should be ~127g not 240g', () => {
    // flour is in NUTRITION_DB: calories 364 per 100g
    // 1 cup = 240ml * 0.53 density = 127.2g
    // calories = 127.2 * 364/100 = ~463 per recipe, per serving (1 serving) = ~463
    const result = calculateNutrition(['1 cup flour'], 1);
    const cal = parseInt(result.calories.replace(/[^0-9]/g, ''));
    // With density: ~127g * 3.64 = ~463 kcal
    // Without density (old): 240g * 3.64 = ~874 kcal
    expect(cal).toBeGreaterThan(400);
    expect(cal).toBeLessThan(520);
  });

  it('applies honey density: 1 cup honey should be ~341g not 240g', () => {
    // honey is in NUTRITION_DB: calories 304 per 100g
    // 1 cup = 240ml * 1.42 density = 340.8g
    // calories = 340.8 * 304/100 = ~1036 per serving
    const result = calculateNutrition(['1 cup honey'], 1);
    const cal = parseInt(result.calories.replace(/[^0-9]/g, ''));
    // With density: ~341g * 3.04 = ~1037 kcal
    // Without density (old): 240g * 3.04 = ~730 kcal
    expect(cal).toBeGreaterThan(950);
    expect(cal).toBeLessThan(1100);
  });

  it('does not affect weight units: 100g flour stays 100g', () => {
    // 100g flour: calories = 100 * 364/100 = 364
    const result = calculateNutrition(['100g flour'], 1);
    const cal = parseInt(result.calories.replace(/[^0-9]/g, ''));
    expect(cal).toBe(364);
  });

  it('does not affect weight units: 1 lb chicken breast stays 453.6g', () => {
    // chicken breast: 165 cal per 100g
    // 1 lb = 453.6g -> 453.6 * 1.65 = ~748
    const result = calculateNutrition(['1 lb chicken breast'], 1);
    const cal = parseInt(result.calories.replace(/[^0-9]/g, ''));
    expect(cal).toBeGreaterThan(700);
    expect(cal).toBeLessThan(800);
  });
});

describe('calculateNutrition match rate', () => {
  it('returns matched and total counts', () => {
    const result = calculateNutrition(['1 cup flour', '1 cup xyzunknownfood123'], 1);
    expect(result.total).toBe(2);
    expect(result.matched).toBe(1);
  });
});
