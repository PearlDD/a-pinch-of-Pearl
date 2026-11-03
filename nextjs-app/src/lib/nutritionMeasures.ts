/** USDA SR28 WEIGHT.txt, grams per household measure, edible portions.
 * https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip
 * Only ingredient-specific measures are used; conversions remain estimates.
 */
export const HOUSEHOLD_MEASURES: Record<string, { sr?: string; source?: string; volume: Record<number, number> }> = {
  // Manufacturer household weight; macro values remain the generic chia reference.
  'chia seeds': { source: "Bob's Red Mill organic chia label (2 tbsp = 26 g)", volume: { 15: 13 } },
  'chia': { source: "Bob's Red Mill organic chia label (2 tbsp = 26 g)", volume: { 15: 13 } },
  'vanilla extract': { sr: '02050', volume: { 5: 4.2, 15: 13, 240: 208 } },
  'vanilla': { sr: '02050', volume: { 5: 4.2, 15: 13, 240: 208 } },
  'cinnamon': { sr: '02010', volume: { 5: 2.6, 15: 7.8 } },
  'flax seeds': { sr: '12220', volume: { 5: 3.4, 15: 10.3, 240: 168 } },
  'flaxseed': { sr: '12220', volume: { 5: 3.4, 15: 10.3, 240: 168 } },
  'ground flaxseed': { sr: '12220', volume: { 5: 2.5, 15: 7 } },
  'hemp seeds': { sr: '12012', volume: { 15: 10 } },
  'capers': { sr: '02054', volume: { 15: 8.6 } },
  'sun dried tomatoes': { sr: '11955', volume: { 240: 54 } },
  'olives': { sr: '09193', volume: { 15: 8.4 } },
  'garlic': { sr: '11215', volume: { 5: 2.8, 240: 136 } },
  'ginger': { sr: '11216', volume: { 5: 2 } },
  'ground ginger': { sr: '02021', volume: { 5: 1.8, 15: 5.2 } },
  'ginger powder': { sr: '02021', volume: { 5: 1.8, 15: 5.2 } },
  'parsley': { sr: '11297', volume: { 15: 3.8, 240: 60 } },
  'salt': { sr: '02047', volume: { 5: 6, 15: 18, 240: 292 } },
  'baking soda': { sr: '18372', volume: { 5: 4.6 } },
  'baking powder': { sr: '18369', volume: { 5: 4.6 } },
  'black pepper': { sr: '02030', volume: { 5: 2.3, 15: 6.9 } },
  'pepper': { sr: '02030', volume: { 5: 2.3, 15: 6.9 } },
  'white pepper': { sr: '02032', volume: { 5: 2.4, 15: 7.1 } },
  'turmeric': { sr: '02043', volume: { 5: 3, 15: 9.4 } },
  'sesame seeds': { sr: '12023', volume: { 15: 9, 240: 144 } },
  'cumin': { sr: '02014', volume: { 5: 2.1, 15: 6 } },
  'cayenne pepper': { sr: '02031', volume: { 5: 1.8, 15: 5.3 } },
  'basil': { sr: '02044', volume: { 15: 2.65 } },
  'green onion': { sr: '11291', volume: { 15: 6, 240: 100 } },
  'cilantro': { sr: '11165', volume: { 240: 16 } },
  'cocoa powder': { sr: '19165', volume: { 15: 5.4, 240: 86 } },
};

// FDA RACC portion references, rather than a universal 100 g fallback.
// https://www.fda.gov/media/102587/download
export const STANDARD_PORTIONS: Record<string, number> = {
  'dry pasta': 55, 'cooked pasta': 140,
  'chicken breast': 85, 'chicken thigh': 85, 'beef': 85, 'ground beef': 85,
  'pork': 85, 'ground pork': 85, 'shrimp': 85, 'fish': 85, 'tuna': 85, 'canned tuna': 85,
  'tofu': 85, 'firm tofu': 85, 'silken tofu': 85,
  'spinach': 85, 'mushroom': 85, 'mushrooms': 85, 'broccoli': 85, 'carrot': 85,
  'rice': 140, 'white rice': 140, 'cooked rice': 140, 'cooked white rice': 140,
  'rice noodles': 140, 'glass noodles': 55,
  'milk': 240, 'whole milk': 240, '2% milk': 240, 'skim milk': 240,
  'water': 240, 'coconut water': 240,
};
