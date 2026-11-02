/** @jest-environment node */
import { extractPage, parseRecipeText, validateImportedRecipe } from '../recipeImport';
import { isPublicAddress, validateSourceUrl } from '../recipeImportFetch';

describe('recipe import', () => {
  it('reads a Recipe inside an @graph, nested sections, entities, durations and nutrition', () => {
    const { recipe } = extractPage(`<script type="application/ld+json">${JSON.stringify({ '@graph': [
      { '@type': 'WebPage', name: 'Ignore' },
      { '@type': ['Recipe'], name: 'Lemon &amp; Orzo', recipeIngredient: ['1 cup orzo', 'Salt &amp; pepper'], recipeInstructions: [
        { '@type': 'HowToSection', name: 'Soup', itemListElement: [{ '@type': 'HowToStep', text: '<p>Boil water.</p>' }] },
        { '@type': 'HowToStep', text: 'Add orzo.' },
      ], prepTime: 'PT10M', cookTime: 'PT1H5M', recipeYield: ['6', 'servings'], nutrition: { calories: '298 kcal', proteinContent: '29 g' } },
    ] })}</script>`, 'https://example.com/soup');
    expect(recipe).toMatchObject({ name: 'Lemon & Orzo', ingredients: ['1 cup orzo', 'Salt & pepper'], instructions: ['Boil water.', 'Add orzo.'], prep_time: '10 min', cook_time: '1 hr 5 min', calories: '298 kcal', protein: '29 g', source_url: 'https://example.com/soup' });
  });
  it('skips malformed or empty recipe blocks and finds the complete recipe', () => {
    const result = extractPage('<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":"Recipe","name":"Empty"}</script><script type="application/ld+json">{"@type":"Recipe","name":"Toast","recipeIngredient":["Bread"],"recipeInstructions":"Toast bread."}</script>', 'https://example.com');
    expect(result.recipe?.name).toBe('Toast');
    expect(result.recipe?.instructions).toEqual(['Toast bread.']);
  });
  it('removes navigation and scripts from article text', () => {
    const result = extractPage('<nav>Login</nav><article><h1>Soup</h1><p>Ingredients</p><p>Carrots</p><script>doBadThings()</script></article>', 'https://example.com');
    expect(result.text).toContain('Carrots');
    expect(result.text).not.toMatch(/Login|doBadThings/);
  });
  it('parses labelled AI answers without inventing missing fields', () => {
    const recipe = parseRecipeText('# Carrot soup\nPrep time: 5 min\n## Ingredients\n- 2 carrots\n- water\n## Instructions\n1. Cut carrots.\n2. Boil.\n## Tips\n- Serve warm.');
    expect(recipe).toMatchObject({ name: 'Carrot soup', prep_time: '5 min', ingredients: ['2 carrots', 'water'], instructions: ['Cut carrots.', 'Boil.'], tips: ['Serve warm.'], calories: '', servings: '' });
  });
  it('supports Chinese headings and markdown', () => {
    expect(parseRecipeText('番茄汤\n**食材：**\n- 番茄 2个\n**步骤：**\n1、切块\n2、煮熟')?.instructions).toEqual(['切块', '煮熟']);
  });
  it('does not mistake a login page or plain title for a recipe', () => {
    expect(parseRecipeText('Sign in\nWelcome back')).toBeNull();
    expect(() => validateImportedRecipe({ name: 'Soup' }, '')).toThrow('No recipe');
  });
  it.each(['http://example.com', 'https://user:pass@example.com', 'https://example.com:8443', 'file:///etc/passwd'])('rejects unsafe URL %s', value => {
    expect(() => validateSourceUrl(value)).toThrow();
  });
  it.each(['127.0.0.1', '10.1.2.3', '172.16.1.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1'])('blocks non-public address %s', value => {
    expect(isPublicAddress(value)).toBe(false);
  });
  it('allows public addresses', () => {
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
  });
});
