/** Explicit food-family proxies, used only with estimation enabled. These are
 * disclosed in the ingredient review; arbitrary substring matches are forbidden. */
export const ESTIMATE_FOOD_ALIASES: Record<string, string> = {
  'high protein rolled oat': 'rolled oats',
  'unflavored protein powder': 'protein powder',
  'unflavored or vanilla protein powder': 'protein powder',
  'pressed extra firm tofu': 'firm tofu', 'extra firm tofu': 'firm tofu',
  'garlic sprout': 'chives', 'garleek': 'chives',
  'ciba chili paste': 'chili sauce',
  'tianmian sauce': 'hoisin sauce',
  'doubanjiang': 'chili bean paste', 'pixian bean paste': 'chili bean paste', 'bean paste': 'chili bean paste',
  'dried chili': 'dried chili pepper', 'dried pepper': 'dried chili pepper',
  'sichuan dried chili pepper': 'dried chili pepper', 'dried arbol': 'dried chili pepper',
  'sichuan chili pepper': 'dried chili pepper',
  'korean kimchi': 'kimchi', 'kimchi juice': 'kimchi',
  'toasted seaweed flake': 'nori', 'seaweed flake': 'nori',
  'whole fish': 'fish', 'chinese celery': 'celery',
  "thai bird's eye chili": 'thai chili', 'green chili pepper': 'chili pepper',
  'numbing peppercorn': 'sichuan peppercorn', 'numbing peppercorn powder': 'sichuan peppercorn',
  'numb peppercorn powder': 'sichuan peppercorn', 'sichuan numb peppercorn powder': 'sichuan peppercorn',
  'nut butter': 'peanut butter', 'nuts': 'almonds', 'nut': 'almonds',
  'brown rice syrup': 'corn syrup', 'rice krispies': 'rice cereal',
  'dried fruit': 'raisins', 'unsweetened coconut': 'shredded coconut', 'unsweetened desiccated coconut': 'shredded coconut', 'unsweetened shredded coconut': 'shredded coconut',
  'cornmeal instant dry': 'cornmeal', 'buttermilk full fat': 'whole buttermilk',
  'instant vanilla pudding mix': 'vanilla pudding mix', 'nilla wafer': 'vanilla wafers',
  'seasoning sauce': 'soy sauce', 'white cabbage': 'cabbage',
  'lamb rack': 'lamb chop', 'colorful carrot bunch': 'carrot', 'rock sugar/candy': 'rock sugar',
  'cantonese sausage': 'chinese sausage', 'dried mushroom': 'dried shiitake mushroom',
  'italian bomba hot pepper sauce': 'chili sauce',
  'pepper flake': 'red pepper flakes',
  "trader joe's reduced fat coconut milk": 'light coconut milk', 'reduced fat coconut milk': 'light coconut milk',
  "trader joe's coconut creamer": 'coconut creamer',
  'whole chicken': 'whole raw chicken', 'beef bone': 'beef broth', 'galangal': 'ginger', 'dried tangerine peel': 'orange peel',
  'black cardamom': 'cardamom', 'white peppercorn': 'white pepper',
  'any veggie you like': 'broccoli', 'suantang': 'tomato sauce', 'lee kum kee selected five spice marinade': 'soy sauce',
  'hot pot spicy soup base': 'hot pot soup base',
  'black tea': 'black tea', 'almond extract': 'almond extract',
};

/** Culinary defaults for vague counts/sizes, not measurements or label claims.
 * Kept food-specific to avoid a universal 100 g/item or 400 g/package fallback. */
export const ESTIMATE_COUNT_GRAMS: Record<string, Record<string, number>> = {
  'butter': { stick: 113 }, 'unsalted butter': { stick: 113 },
  'beer': { bottle: 330 },
  'orange peel': { slice: 1, piece: 1 },
  'white pepper': { handful: 10 },
  'tomato sauce': { bottle: 250 },
  'soy sauce': { bottle: 414 },
  'hot pot soup base': { '': 200, package: 200, block: 200 },
  'garlic': { head: 30 }, // about ten USDA 3 g cloves
  'ginger': { piece: 5, slice: 2.2 },
  'chives': { '': 10, stalk: 10, bunch: 20 },
  'lemongrass': { stalk: 12 },
  'chili pepper': { '': 45 },
  'dried shiitake mushroom': { '': 3.6 },
  'dried chili pepper': { package: 50, bag: 50, '': 1, piece: 1, handful: 10 },
  'cauliflower': { '': 588, head: 588 }, // USDA 11135 medium head
  'cabbage': { '': 908, head: 908 }, // USDA 11109 medium head
  'napa cabbage': { '': 900, head: 900 },
  'ginger powder': { '': 2 },
  'sichuan peppercorn': { '': 2, handful: 10 },
  'cumin': { '': 2, handful: 10 },
  'star anise': { '': 2, each: 2, piece: 2 },
  'bay leaf': { '': 0.2, slice: 0.2, piece: 0.2 },
  'cardamom': { '': 1, each: 1, piece: 1 },
  'carrot': { bunch: 420 }, // about six 70 g carrots
  'blueberries': { handful: 37 }, // quarter of USDA 148 g cup
  'bacon': { strip: 8, slice: 8 }, // cooked bacon reference
  'pork ribs': { strip: 85 }, // edible portion estimate
  'fish': { '': 85 }, // edible fish portion; whole-fish yield remains uncertain
  'cilantro': { '': 20 / 9, bunch: 20 },
  'nori': { '': 1, handful: 2 },
  'firm tofu': { block: 350, box: 350, package: 350 },
  'silken tofu': { block: 350, box: 350, package: 350 },
  'kimchi': { bowl: 150 },
};
