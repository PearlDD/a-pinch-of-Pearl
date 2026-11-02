import { load } from 'cheerio';

export const IMPORT_TEXT_LIMIT = 40000;
export const recipeTextFields = ['name', 'description', 'prep_time', 'cook_time', 'servings', 'calories', 'carbs', 'protein', 'fat', 'fiber'] as const;
export const recipeListFields = ['ingredients', 'instructions', 'tips'] as const;
export type ImportedRecipe = Record<typeof recipeTextFields[number], string> &
  Record<typeof recipeListFields[number], string[]> & { source_url: string };

export class ImportError extends Error {
  constructor(message: string, public status = 422, public code?: string) { super(message); }
}

export function emptyImportedRecipe(): ImportedRecipe {
  return { name: '', description: '', prep_time: '', cook_time: '', servings: '', calories: '', carbs: '', protein: '', fat: '', fiber: '', ingredients: [], instructions: [], tips: [], source_url: '' };
}

function clean(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const $ = load(String(value), null, false);
  return $.text().trim().slice(0, 4000);
}

function strings(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).map(clean).filter(Boolean).slice(0, 150);
}

function steps(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(steps).slice(0, 150);
  if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>;
    return steps(node.itemListElement ?? node.text ?? node.name);
  }
  return strings(value);
}

function duration(value: unknown): string {
  const text = clean(value);
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+)S)?$/i.exec(text);
  if (!match) return text;
  return [match[1] && `${match[1]} days`, match[2] && `${match[2]} hr`, match[3] && `${match[3]} min`, match[4] && `${match[4]} sec`].filter(Boolean).join(' ');
}

function findRecipes(value: unknown, depth = 0): Record<string, unknown>[] {
  if (!value || typeof value !== 'object' || depth > 15) return [];
  if (Array.isArray(value)) return value.flatMap(item => findRecipes(item, depth + 1));
  const node = value as Record<string, unknown>;
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (types.some(type => typeof type === 'string' && /(?:^|[/#])Recipe$/i.test(type))) return [node];
  return Object.values(node).flatMap(item => findRecipes(item, depth + 1));
}

export function extractPage(html: string, sourceUrl: string): { recipe: ImportedRecipe | null; text: string } {
  const $ = load(html);
  const candidates: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try { candidates.push(...findRecipes(JSON.parse($(script).text()))); } catch { /* A malformed block must not hide valid blocks. */ }
  });
  candidates.sort((a, b) => strings(b.recipeIngredient).length + steps(b.recipeInstructions).length - strings(a.recipeIngredient).length - steps(a.recipeInstructions).length);
  for (const node of candidates) {
    const recipe = emptyImportedRecipe();
    recipe.name = clean(node.name);
    recipe.description = clean(node.description);
    recipe.ingredients = strings(node.recipeIngredient);
    recipe.instructions = steps(node.recipeInstructions);
    recipe.servings = strings(node.recipeYield).join(', ');
    recipe.prep_time = duration(node.prepTime);
    recipe.cook_time = duration(node.cookTime);
    recipe.source_url = sourceUrl;
    const nutrition = (node.nutrition || {}) as Record<string, unknown>;
    for (const [target, source] of Object.entries({ calories: 'calories', carbs: 'carbohydrateContent', protein: 'proteinContent', fat: 'fatContent', fiber: 'fiberContent' })) {
      recipe[target as typeof recipeTextFields[number]] = clean(nutrition[source]);
    }
    if (recipe.name && (recipe.ingredients.length || recipe.instructions.length)) return { recipe, text: '' };
  }

  // Rednote embeds post text in initial state. Parse JSON only; never execute page scripts.
  const postText: string[] = [];
  $('script').each((_, script) => {
    const state = $(script).text().match(/window\.__INITIAL_STATE__\s*=\s*([\s\S]*?)\s*;?\s*$/)?.[1];
    if (!state) return;
    try {
      const parsed = JSON.parse(state);
      const visit = (value: unknown, depth = 0) => {
        if (!value || typeof value !== 'object' || depth > 15) return;
        const node = value as Record<string, unknown>;
        if (typeof node.desc === 'string' && (typeof node.title === 'string' || node.type === 'video')) {
          postText.push(clean(node.title), clean(node.desc));
        } else { Object.values(node).forEach(item => visit(item, depth + 1)); }
      };
      visit(parsed);
    } catch { /* Fall back to visible page text. */ }
  });
  $('script, style, nav, header, footer, aside, form, noscript').remove();
  $('br').replaceWith('\n');
  $('p, li, h1, h2, h3, h4, section, div').append('\n');
  const main = $('article').first().text() || $('main').first().text() || $('body').text();
  const text = (postText.length ? postText.join('\n') : `${$('title').text()}\n${main}`)
    .replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').trim().slice(0, IMPORT_TEXT_LIMIT);
  return { recipe: null, text };
}

// A no-key fallback for clearly labelled English / Chinese recipes pasted from AI.
export function parseRecipeText(text: string, sourceUrl = ''): ImportedRecipe | null {
  const recipe = emptyImportedRecipe();
  recipe.source_url = sourceUrl;
  let section: 'ingredients' | 'instructions' | 'tips' | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim();
    if (!line) continue;
    const heading = line.replace(/[：:]\s*$/, '').trim();
    if (/^(ingredients?(?:\s*\([^)]*\))?|食材|材料|原料|用料)$/i.test(heading)) { section = 'ingredients'; continue; }
    if (/^(instructions?|directions?|method|steps?|做法|步骤|製作步驟|制作步骤)$/i.test(heading)) { section = 'instructions'; continue; }
    if (/^(notes?|tips?|小贴士|小貼士|备注|備註)$/i.test(heading)) { section = 'tips'; continue; }
    const metadata = /^(prep(?: time)?|cook(?: time)?|servings?|准备时间|烹饪时间|份量)\s*[：:]\s*(.+)$/i.exec(line);
    if (metadata) {
      const key = /prep|准备/i.test(metadata[1]) ? 'prep_time' : /cook|烹饪/i.test(metadata[1]) ? 'cook_time' : 'servings';
      recipe[key] = metadata[2].trim(); section = null; continue;
    }
    if (section) recipe[section].push(line.replace(/^(?:[-*•]\s+|\d+[.)、]\s*)/, ''));
    else if (!recipe.name) recipe.name = line.replace(/^(?:recipe|title|菜名)\s*[：:]\s*/i, '');
  }
  return recipe.name && recipe.ingredients.length && recipe.instructions.length ? recipe : null;
}

export function validateImportedRecipe(value: unknown, sourceUrl: string): ImportedRecipe {
  if (!value || typeof value !== 'object') throw new ImportError('The importer returned an invalid recipe. Please try pasting the recipe text.');
  const node = value as Record<string, unknown>;
  const recipe = emptyImportedRecipe();
  for (const key of recipeTextFields) recipe[key] = clean(node[key]);
  for (const key of recipeListFields) recipe[key] = strings(node[key]);
  recipe.source_url = sourceUrl;
  if (!recipe.name || (!recipe.ingredients.length && !recipe.instructions.length)) {
    throw new ImportError('No recipe ingredients or steps were found. Paste the recipe text or video transcript instead.');
  }
  return recipe;
}
