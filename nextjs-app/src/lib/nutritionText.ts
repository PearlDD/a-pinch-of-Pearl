/** Syntax normalization only: never supplies a missing food amount. */
const chineseNumbers: Record<string, string> = { 一: '1', 二: '2', 两: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9', 十: '10', 半: '1/2' };
const chineseFoods: Record<string, string> = {
  牛肉: 'beef', 猪肉: 'pork', 猪肉末: 'ground pork', 牛肉末: 'ground beef', 鸡胸肉: 'chicken breast', 鸡腿肉: 'chicken thigh',
  白洋葱: 'white onion', 红洋葱: 'red onion', 洋葱: 'onion', 大蒜: 'garlic', 蒜: 'garlic', 老姜: 'ginger', 姜: 'ginger',
  蛋黄: 'egg yolk', 蛋白: 'egg white', 鸡蛋: 'egg', 番茄: 'tomato', 西红柿: 'tomato', 香菜: 'cilantro', 葱花: 'green onion',
  白糖: 'sugar', 糖: 'sugar', 盐: 'salt', 酱油: 'soy sauce', 生抽: 'light soy sauce', 老抽: 'dark soy sauce',
  料酒: 'cooking wine', 醋: 'vinegar', 蚝油: 'oyster sauce', 花椒: 'sichuan peppercorn', 八角: 'star anise', 香叶: 'bay leaf',
  干辣椒: 'dried chili pepper', 干辣椒粉: 'chili powder', 黑胡椒: 'black pepper', 白胡椒粉: 'white pepper', 小茴香: 'cumin',
  牛奶: 'milk', 黄油: 'butter', 面粉: 'flour', 玉米淀粉: 'cornstarch', 水: 'water', 米粉: 'rice noodles', 豆腐: 'tofu',
};
const chineseUnits: Record<string, string> = { 千克: 'kg', 公斤: 'kg', 毫克: 'mg', 克: 'g', 毫升: 'ml', 公升: 'l', 升: 'l', 磅: 'lb', 盎司: 'oz', 大匙: 'tbsp', 小匙: 'tsp', 汤匙: 'tbsp', 茶匙: 'tsp', 勺: 'spoon', 个: 'each', 颗: 'piece', 片: 'slice', 头: 'head', 把: 'handful', 块: 'piece', 包: 'package', 瓶: 'bottle', 罐: 'can', 碗: 'bowl', 杯: 'cup' };

export function normalizeIngredientText(input: string): string {
  let text = input.replace(/（/g, '(').replace(/）/g, ')').replace(/：/g, ':').replace(/，/g, ',')
    .replace(/【([^】]+)】/g, '[$1]').replace(/\[([^\]]+)\]\s*\(https?:\/\/[^)]+\)/g, '$1');
  // Chinese quantities can precede or follow a food name. Bare 勺 is deliberately
  // not translated to tablespoon: its size must be confirmed.
  text = text.replace(/(?:[一二两三四五六七八九]?十[一二两三四五六七八九]?|[一二两三四五六七八九半])(?=\s*(?:到|至|千克|公斤|毫克|毫升|公升|盎司|大匙|小匙|汤匙|茶匙|克|升|磅|勺|个|颗|片|头|把|块|包|瓶|罐|碗|杯|整只|只))/g, n => {
    if (!n.includes('十')) return chineseNumbers[n];
    const [tens, ones] = n.split('十');
    return String(Number(tens ? chineseNumbers[tens] : 1) * 10 + Number(ones ? chineseNumbers[ones] : 0));
  });
  text = text.replace(/(\d)\s*(?:到|至)\s*(\d)/g, '$1-$2');
  text = text.replace(/(\d+(?:\.\d+|\/\d+)?(?:\s*-\s*\d+)?)\s*(千克|公斤|毫克|毫升|公升|盎司|大匙|小匙|汤匙|茶匙|克|升|磅|勺|个|颗|片|头|把|块|包|瓶|罐|碗|杯)/g, (_, n, unit) => `${n} ${chineseUnits[unit]} `);
  const trailing = text.match(/^([^\d]+?)\s*(\d+(?:\.\d+|\/\d+)?(?:\s*-\s*\d+)?\s+(?:kg|mg|g|ml|l|lb|oz|tbsp|tsp|spoon|piece|each|slice|head|handful|package|bottle|can|bowl|cup))\s*(.*)$/);
  if (trailing && /[\u4e00-\u9fff]/.test(trailing[1])) text = `${trailing[2]} ${trailing[1]} ${trailing[3]}`;
  text = text.replace(/剥皮备用/g, 'peeled').replace(/适量/g, ' as needed ').replace(/切碎|切片|切块|剁碎/g, ' chopped ');
  for (const [name, english] of Object.entries(chineseFoods).sort((a, b) => b[0].length - a[0].length)) {
    if (text.includes(name)) text = text.replaceAll(name, ` ${english} `);
  }
  return text.replace(/\s+/g, ' ').trim();
}

export function isIngredientHeading(line: string): boolean {
  return /^\s*(?:【[^】]+】|\[[^\]]+\]|(?:for the (?:fish|sauce)|pork|dip|shortcakes|before baking|blueberry sauce|cream topping|garnish)\s*:)\s*$/i.test(line);
}

/** Remove only recognized preparation phrases. Alternatives/marinades stay
 * visible so they cannot be silently discarded as if they were just a cut. */
export function normalizeFoodText(input: string): string {
  let food = input.toLowerCase().replace(/boneless and skinless/g, 'boneless skinless').replace(/\.$/, '').replace(/\b2%\s*milk\b/g, '2% milk');
  food = food.replace(/,?\s*(?:cut|cuted|shred|shredded|slice|sliced)\s+into\s+(?:(?:small|large|big|thin|thick|1-inch|half-inch|1-2 inches|2 inches)\s+)*(?:pieces|cubes|strips|segments)\s*$/i, '')
    .replace(/,?\s*mixed with water\s*$/i, '').replace(/,?\s*(?:sliced slightly on the thicker side|cut in half|mashed|smashed|toasted|chopped|diced|minced|finely chopped)\s*$/i, '');
  return food.replace(/\b(?:high-quality|ripe|barely ripe|ice cold|cold|fine|coarse)\b/g, '').replace(/\s+/g, ' ').trim();
}
