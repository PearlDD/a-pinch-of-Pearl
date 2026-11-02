// Parsing is deliberately separate from food matching: a known food is not a
// known amount. Missing/ambiguous amounts must never default to 100 g.
const NUMBER = '(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d*\\.\\d+|\\d+)';
const fractions: Record<string, string> = { '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5' };
export const MASS_UNITS: Record<string, number> = { g: 1, gram: 1, grams: 1, kg: 1000, kilogram: 1000, kilograms: 1000, mg: 0.001, milligram: 0.001, milligrams: 0.001, oz: 28.35, ounce: 28.35, ounces: 28.35, lb: 453.6, lbs: 453.6, pound: 453.6, pounds: 453.6 };
export const VOLUME_ML: Record<string, number> = { ml: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1, l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000, cup: 240, cups: 240, c: 240, tbsp: 15, tablespoon: 15, tablespoons: 15, tbs: 15, tsp: 5, teaspoon: 5, teaspoons: 5, 'fl oz': 30, 'fluid ounce': 30, 'fluid ounces': 30, pint: 480, pints: 480, pt: 480, quart: 960, quarts: 960, qt: 960, gallon: 3840, gallons: 3840, gal: 3840 };
export const CONTAINERS = new Set(['can', 'cans', 'tin', 'tins', 'jar', 'jars', 'package', 'packages', 'pkg', 'packet', 'packets', 'bag', 'bags', 'block', 'blocks']);
const otherUnits = ['portion', 'portions', 'serving', 'servings', 'handful', 'handfuls', 'bunch', 'bunches', 'scoop', 'scoops', 'some', 'few', 'several', 'splash', 'splashes', 'drizzle', 'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves', 'fillet', 'fillets', 'stalk', 'stalks', 'sprig', 'sprigs', 'pinch', 'pinches', 'dash', 'dashes', 'stick', 'sticks', 'head', 'heads', 'leaf', 'leaves', 'strip', 'strips', 'link', 'links', 'sheet', 'sheets', 'wrapper', 'wrappers', 'breast', 'breasts', 'thigh', 'thighs', 'wing', 'wings', 'drumstick', 'drumsticks'];
const units = [...Object.keys(MASS_UNITS), ...Object.keys(VOLUME_ML), ...CONTAINERS, ...otherUnits].sort((a, b) => b.length - a.length);
const unitPattern = new RegExp(`^(${units.join('|')})\\.?(?=\\s|$)\\s*`, 'i');
const massPattern = new RegExp(`(${NUMBER})\\s*(${Object.keys(MASS_UNITS).sort((a, b) => b.length - a.length).join('|')})\\b`, 'i');

export function normalizeQuantityText(input: string): string {
  return input.toLowerCase().replace(/⁄/g, '/').replace(/[¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘]/g, (value, offset: number) => `${offset > 0 && /\d/.test(input[offset - 1]) ? ' ' : ''}${fractions[value]}`)
    .replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1').replace(/\b(fl|oz|lbs?|tbsp|tbs|tsp)\./g, '$1').replace(/\s+/g, ' ').trim();
}

export function parseQuantity(input: string): number | null {
  const text = normalizeQuantityText(input);
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) return Number(mixed[3]) ? Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]) : null;
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
  return /^(?:\d*\.\d+|\d+)$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}

export interface ParsedIngredient {
  quantity: number | null;
  unit: string;
  food: string;
  weight: number | null;
  weightIsPerItem: boolean;
  packageWeight: number | null;
  packageWeightIsEdible: boolean;
  approximate: boolean;
  issue?: string;
}

export function parseIngredientLine(input: string): ParsedIngredient {
  let line = normalizeQuantityText(input.replace(/^\s*[-•*]\s+/, ''));
  let approximate = /\b(?:about|approximately|roughly|heaping|heaped|rounded)\b/.test(line);
  line = line.replace(/^(?:about|approximately|roughly)\s+/, '');
  const wordNumbers: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12', a: '1', an: '1' };
  if (/^(?:a )?couple of\b/.test(line)) { line = line.replace(/^(?:a )?couple of\b/, '2'); approximate = true; }
  line = line.replace(/^(?:a )?half(?: of)?(?: a| an| the)?\b/, '1/2').replace(/^(?:a )?quarter(?: of)?(?: a| an| the)?\b/, '1/4');
  line = line.replace(/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a|an)\b/, word => wordNumbers[word]);
  // Recognize amounts in parentheses without discarding them as preparation notes.
  const parentheses = [...line.matchAll(/\(([^)]*)\)/g)].map(match => match[1]);
  const weightText = parentheses.find(text => massPattern.test(text));
  const beforeWeight = weightText ? line.slice(0, line.indexOf(`(${weightText})`)).trim() : '';
  const mass = weightText?.match(massPattern);
  const weight = mass && parseQuantity(mass[1]) !== null ? parseQuantity(mass[1])! * MASS_UNITS[mass[2]] : null;
  const invalidWeight = weightText && (weight === null || /(?:^|\s)-\s*\d/.test(weightText) || new RegExp(`${NUMBER}\\s*(?:-|–|to)\\s*${NUMBER}`).test(weightText));
  const perItem = !!weightText && /\b(?:each|per)\b/.test(weightText);
  const state = parentheses.join(' ').match(/\b(?:dry|uncooked|cooked|raw)\b/)?.[0] || '';
  line = line.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  // Also accept "flour (100 g)" and "flour - 100 g" without inventing a count.
  const trailing = line.match(new RegExp(`^(.+?)\\s*(?:[:,]|\\s[-–]\\s*)\\s*(${NUMBER}\\s*.+)$`));
  if (trailing && !new RegExp(`^${NUMBER}`).test(line)) line = `${trailing[2]} ${trailing[1]}`;
  const range = line.match(new RegExp(`^(${NUMBER})\\s*(?:-|–|to)\\s*(${NUMBER})\\s*`));
  let issue = invalidWeight ? 'Specify one valid, non-negative weight in parentheses.' : range ? 'Choose one amount instead of a range.' : undefined;
  if (range) line = line.slice(range[0].length);
  const prefix = !range && line.match(new RegExp(`^(${NUMBER})(?=\\s|[a-z]|$)\\s*`));
  const quantity = prefix ? parseQuantity(prefix[1]) : null;
  if (prefix) line = line.slice(prefix[0].length).replace(/^(?:of\s+)?(?:a |an |the )?/, '');
  if (prefix && quantity === null) issue = 'The quantity is invalid.';
  const negative = /^-\d/.test(line);
  if (negative) { issue = 'Ingredient quantities cannot be negative.'; line = line.replace(new RegExp(`^-${NUMBER}\\s*`), ''); }
  // "1/4 of a 113 g can of tuna": the second mass describes the container.
  const pack = line.match(new RegExp(`^(${NUMBER})\\s*(${Object.keys(MASS_UNITS).join('|')})\\s+(${[...CONTAINERS].join('|')})\\b\\s*`));
  let packageWeight: number | null = null;
  let unit = '';
  if (pack) {
    packageWeight = parseQuantity(pack[1])! * MASS_UNITS[pack[2]];
    unit = pack[3]; line = line.slice(pack[0].length);
  } else {
    const unitMatch = line.match(unitPattern);
    if (unitMatch) { unit = unitMatch[1]; line = line.slice(unitMatch[0].length); }
  }
  if (CONTAINERS.has(unit) && weight !== null && !/\b(?:total|used)\b/.test(weightText || '')) {
    if (perItem || new RegExp(`\\b(?:${[...CONTAINERS].join('|')})$`).test(beforeWeight)) packageWeight = weight;
    else issue = 'Clarify whether the parenthetical weight is the package size (write it immediately after can, or add per can) or the amount used (add total/used).';
  }
  const food = `${line.replace(/^(?:of\s+)?(?:a |an |the )?/, '')} ${state}`.trim();
  return { quantity: negative || range ? null : quantity, unit, food, weight: packageWeight === null ? weight : null, weightIsPerItem: perItem, packageWeight, packageWeightIsEdible: /\b(?:drained|edible)\b/.test(weightText || ''), approximate, issue };
}
