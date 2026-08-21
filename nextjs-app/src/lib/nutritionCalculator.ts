// Client-side nutrition calculator using USDA reference values
// Values are per 100g: { calories (kcal), carbs (g), protein (g), fat (g), fiber (g) }

interface NutritionPer100g {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

const NUTRITION_DB: Record<string, NutritionPer100g> = {
  // ── Poultry ──
  'chicken thigh': { calories: 209, carbs: 0, protein: 26, fat: 10.9, fiber: 0 },
  'chicken breast': { calories: 165, carbs: 0, protein: 31, fat: 3.6, fiber: 0 },
  'chicken drumstick': { calories: 172, carbs: 0, protein: 28.3, fat: 5.7, fiber: 0 },
  'chicken wing': { calories: 203, carbs: 0, protein: 30.5, fat: 8.1, fiber: 0 },
  'chicken': { calories: 189, carbs: 0, protein: 27, fat: 7.4, fiber: 0 },
  'ground chicken': { calories: 189, carbs: 0, protein: 20.4, fat: 11.1, fiber: 0 },
  'ground turkey': { calories: 170, carbs: 0, protein: 21.1, fat: 9.4, fiber: 0 },
  'turkey breast': { calories: 135, carbs: 0, protein: 30, fat: 1, fiber: 0 },
  'duck': { calories: 337, carbs: 0, protein: 19, fat: 28.4, fiber: 0 },
  'duck breast': { calories: 140, carbs: 0, protein: 23.5, fat: 4.8, fiber: 0 },

  // ── Beef ──
  'ground beef': { calories: 254, carbs: 0, protein: 17.2, fat: 20, fiber: 0 },
  'lean ground beef': { calories: 176, carbs: 0, protein: 20, fat: 10, fiber: 0 },
  'beef': { calories: 250, carbs: 0, protein: 26, fat: 15, fiber: 0 },
  'steak': { calories: 271, carbs: 0, protein: 26, fat: 18, fiber: 0 },
  'beef chuck': { calories: 250, carbs: 0, protein: 26, fat: 15.4, fiber: 0 },
  'beef sirloin': { calories: 207, carbs: 0, protein: 28.1, fat: 9.7, fiber: 0 },
  'beef short rib': { calories: 295, carbs: 0, protein: 23.4, fat: 21.6, fiber: 0 },
  'beef brisket': { calories: 267, carbs: 0, protein: 24, fat: 18, fiber: 0 },
  'flank steak': { calories: 192, carbs: 0, protein: 27.4, fat: 8.2, fiber: 0 },
  'ribeye': { calories: 291, carbs: 0, protein: 24, fat: 21, fiber: 0 },

  // ── Pork ──
  'pork': { calories: 242, carbs: 0, protein: 27.3, fat: 14, fiber: 0 },
  'ground pork': { calories: 263, carbs: 0, protein: 16.9, fat: 21.2, fiber: 0 },
  'pork belly': { calories: 518, carbs: 0, protein: 9.3, fat: 53, fiber: 0 },
  'pork shoulder': { calories: 236, carbs: 0, protein: 17, fat: 18, fiber: 0 },
  'pork chop': { calories: 231, carbs: 0, protein: 25.7, fat: 13.5, fiber: 0 },
  'pork loin': { calories: 195, carbs: 0, protein: 28, fat: 8.6, fiber: 0 },
  'pork tenderloin': { calories: 143, carbs: 0, protein: 26, fat: 3.5, fiber: 0 },
  'bacon': { calories: 541, carbs: 1.4, protein: 37, fat: 42, fiber: 0 },
  'ham': { calories: 145, carbs: 1.5, protein: 21, fat: 5.5, fiber: 0 },
  'sausage': { calories: 301, carbs: 2, protein: 12, fat: 27, fiber: 0 },
  'italian sausage': { calories: 304, carbs: 1.4, protein: 14.3, fat: 26.6, fiber: 0 },
  'chinese sausage': { calories: 372, carbs: 9, protein: 18.2, fat: 29.7, fiber: 0 },
  'lap cheong': { calories: 372, carbs: 9, protein: 18.2, fat: 29.7, fiber: 0 },
  'spam': { calories: 315, carbs: 2.5, protein: 13, fat: 27, fiber: 0 },

  // ── Lamb ──
  'lamb': { calories: 294, carbs: 0, protein: 25, fat: 21, fiber: 0 },
  'ground lamb': { calories: 282, carbs: 0, protein: 24.8, fat: 19.7, fiber: 0 },
  'lamb chop': { calories: 294, carbs: 0, protein: 25, fat: 21, fiber: 0 },
  'lamb leg': { calories: 230, carbs: 0, protein: 28, fat: 12, fiber: 0 },
  'lamb shoulder': { calories: 275, carbs: 0, protein: 24, fat: 19, fiber: 0 },

  // ── Seafood ──
  'shrimp': { calories: 99, carbs: 0.2, protein: 24, fat: 0.3, fiber: 0 },
  'prawns': { calories: 99, carbs: 0.2, protein: 24, fat: 0.3, fiber: 0 },
  'salmon': { calories: 208, carbs: 0, protein: 20, fat: 13, fiber: 0 },
  'tuna': { calories: 132, carbs: 0, protein: 28, fat: 1.3, fiber: 0 },
  'canned tuna': { calories: 116, carbs: 0, protein: 25.5, fat: 0.8, fiber: 0 },
  'cod': { calories: 82, carbs: 0, protein: 18, fat: 0.7, fiber: 0 },
  'tilapia': { calories: 96, carbs: 0, protein: 20, fat: 1.7, fiber: 0 },
  'fish': { calories: 105, carbs: 0, protein: 22, fat: 1.5, fiber: 0 },
  'white fish': { calories: 90, carbs: 0, protein: 19, fat: 1.3, fiber: 0 },
  'catfish': { calories: 119, carbs: 0, protein: 18.4, fat: 4.8, fiber: 0 },
  'halibut': { calories: 111, carbs: 0, protein: 22.5, fat: 1.6, fiber: 0 },
  'mackerel': { calories: 262, carbs: 0, protein: 24, fat: 17.8, fiber: 0 },
  'sardines': { calories: 208, carbs: 0, protein: 24.6, fat: 11.4, fiber: 0 },
  'squid': { calories: 92, carbs: 3.1, protein: 15.6, fat: 1.4, fiber: 0 },
  'calamari': { calories: 92, carbs: 3.1, protein: 15.6, fat: 1.4, fiber: 0 },
  'scallop': { calories: 69, carbs: 3.2, protein: 12.1, fat: 0.5, fiber: 0 },
  'scallops': { calories: 69, carbs: 3.2, protein: 12.1, fat: 0.5, fiber: 0 },
  'crab': { calories: 83, carbs: 0, protein: 18.1, fat: 1, fiber: 0 },
  'crab meat': { calories: 83, carbs: 0, protein: 18.1, fat: 1, fiber: 0 },
  'lobster': { calories: 89, carbs: 0, protein: 19, fat: 0.9, fiber: 0 },
  'mussels': { calories: 86, carbs: 3.7, protein: 11.9, fat: 2.2, fiber: 0 },
  'clams': { calories: 74, carbs: 2.6, protein: 12.8, fat: 1, fiber: 0 },
  'oyster': { calories: 68, carbs: 3.9, protein: 7, fat: 2.5, fiber: 0 },
  'oysters': { calories: 68, carbs: 3.9, protein: 7, fat: 2.5, fiber: 0 },
  'imitation crab': { calories: 95, carbs: 15, protein: 6.5, fat: 0.4, fiber: 0 },
  'fish cake': { calories: 130, carbs: 15, protein: 10, fat: 3, fiber: 0 },
  'fish ball': { calories: 106, carbs: 11, protein: 9, fat: 2.5, fiber: 0 },
  'anchovies': { calories: 131, carbs: 0, protein: 20.4, fat: 4.8, fiber: 0 },
  'dried shrimp': { calories: 263, carbs: 3, protein: 55, fat: 2.7, fiber: 0 },

  // ── Eggs & Tofu ──
  'egg': { calories: 155, carbs: 1.1, protein: 13, fat: 11, fiber: 0 },
  'eggs': { calories: 155, carbs: 1.1, protein: 13, fat: 11, fiber: 0 },
  'egg white': { calories: 52, carbs: 0.7, protein: 11, fat: 0.2, fiber: 0 },
  'egg whites': { calories: 52, carbs: 0.7, protein: 11, fat: 0.2, fiber: 0 },
  'egg yolk': { calories: 322, carbs: 3.6, protein: 16, fat: 27, fiber: 0 },
  'egg yolks': { calories: 322, carbs: 3.6, protein: 16, fat: 27, fiber: 0 },
  'tofu': { calories: 76, carbs: 1.9, protein: 8, fat: 4.8, fiber: 0.3 },
  'firm tofu': { calories: 76, carbs: 1.9, protein: 8, fat: 4.8, fiber: 0.3 },
  'silken tofu': { calories: 55, carbs: 2.6, protein: 4.9, fat: 2.7, fiber: 0 },
  'soft tofu': { calories: 55, carbs: 2.6, protein: 4.9, fat: 2.7, fiber: 0 },
  'tempeh': { calories: 192, carbs: 7.6, protein: 20.3, fat: 10.8, fiber: 0 },
  'edamame': { calories: 121, carbs: 8.9, protein: 11.9, fat: 5.2, fiber: 5.2 },

  // ── Grains & Pasta ──
  'rice': { calories: 130, carbs: 28.2, protein: 2.7, fat: 0.3, fiber: 0.4 },
  'white rice': { calories: 130, carbs: 28.2, protein: 2.7, fat: 0.3, fiber: 0.4 },
  'brown rice': { calories: 123, carbs: 25.6, protein: 2.7, fat: 1, fiber: 1.6 },
  'jasmine rice': { calories: 130, carbs: 28.2, protein: 2.7, fat: 0.3, fiber: 0.4 },
  'sticky rice': { calories: 97, carbs: 21, protein: 2, fat: 0.2, fiber: 0 },
  'glutinous rice': { calories: 97, carbs: 21, protein: 2, fat: 0.2, fiber: 0 },
  'sushi rice': { calories: 130, carbs: 28.2, protein: 2.7, fat: 0.3, fiber: 0.4 },
  'basmati rice': { calories: 130, carbs: 28.2, protein: 2.7, fat: 0.3, fiber: 0.4 },
  'rice flour': { calories: 366, carbs: 80, protein: 6, fat: 1.4, fiber: 2.4 },
  'glutinous rice flour': { calories: 366, carbs: 81, protein: 6.3, fat: 0.6, fiber: 1 },
  'oats': { calories: 389, carbs: 66.3, protein: 16.9, fat: 6.9, fiber: 10.6 },
  'rolled oats': { calories: 379, carbs: 67.7, protein: 13.2, fat: 6.5, fiber: 10.1 },
  'oatmeal': { calories: 379, carbs: 67.7, protein: 13.2, fat: 6.5, fiber: 10.1 },
  'pasta': { calories: 131, carbs: 25, protein: 5, fat: 1.1, fiber: 1.8 },
  'spaghetti': { calories: 131, carbs: 25, protein: 5, fat: 1.1, fiber: 1.8 },
  'penne': { calories: 131, carbs: 25, protein: 5, fat: 1.1, fiber: 1.8 },
  'macaroni': { calories: 131, carbs: 25, protein: 5, fat: 1.1, fiber: 1.8 },
  'egg noodles': { calories: 138, carbs: 25, protein: 4.5, fat: 2.1, fiber: 1.2 },
  'noodles': { calories: 138, carbs: 25, protein: 4.5, fat: 2.1, fiber: 1.2 },
  'ramen noodles': { calories: 138, carbs: 25, protein: 4.5, fat: 2.1, fiber: 1.2 },
  'udon noodles': { calories: 99, carbs: 21.6, protein: 2.6, fat: 0.1, fiber: 0.9 },
  'udon': { calories: 99, carbs: 21.6, protein: 2.6, fat: 0.1, fiber: 0.9 },
  'soba noodles': { calories: 99, carbs: 21.4, protein: 5.1, fat: 0.1, fiber: 0 },
  'soba': { calories: 99, carbs: 21.4, protein: 5.1, fat: 0.1, fiber: 0 },
  'rice noodles': { calories: 109, carbs: 25.1, protein: 0.9, fat: 0.2, fiber: 0.9 },
  'vermicelli': { calories: 109, carbs: 25.1, protein: 0.9, fat: 0.2, fiber: 0.9 },
  'glass noodles': { calories: 334, carbs: 82.3, protein: 0.1, fat: 0.1, fiber: 0.5 },
  'cellophane noodles': { calories: 334, carbs: 82.3, protein: 0.1, fat: 0.1, fiber: 0.5 },
  'sweet potato noodles': { calories: 334, carbs: 82, protein: 0, fat: 0, fiber: 0.5 },
  'japchae noodles': { calories: 334, carbs: 82, protein: 0, fat: 0, fiber: 0.5 },
  'bread': { calories: 265, carbs: 49, protein: 9, fat: 3.2, fiber: 2.7 },
  'bread crumbs': { calories: 395, carbs: 72, protein: 13.4, fat: 5.3, fiber: 4.5 },
  'panko': { calories: 395, carbs: 72, protein: 13.4, fat: 5.3, fiber: 4.5 },
  'tortilla': { calories: 312, carbs: 51.6, protein: 8.1, fat: 8, fiber: 3.3 },
  'flour tortilla': { calories: 312, carbs: 51.6, protein: 8.1, fat: 8, fiber: 3.3 },
  'corn tortilla': { calories: 218, carbs: 44.6, protein: 5.7, fat: 2.8, fiber: 5.4 },
  'pita bread': { calories: 275, carbs: 55.7, protein: 9.1, fat: 1.2, fiber: 2.2 },
  'couscous': { calories: 112, carbs: 23.2, protein: 3.8, fat: 0.2, fiber: 1.4 },
  'quinoa': { calories: 120, carbs: 21.3, protein: 4.4, fat: 1.9, fiber: 2.8 },
  'bulgur': { calories: 83, carbs: 18.6, protein: 3.1, fat: 0.2, fiber: 4.5 },
  'polenta': { calories: 85, carbs: 17, protein: 2, fat: 1, fiber: 1.4 },
  'dumpling wrappers': { calories: 292, carbs: 58, protein: 8.5, fat: 1.5, fiber: 1.5 },
  'wonton wrappers': { calories: 292, carbs: 58, protein: 8.5, fat: 1.5, fiber: 1.5 },
  'spring roll wrappers': { calories: 310, carbs: 64, protein: 8, fat: 1.5, fiber: 1 },
  'rice paper': { calories: 315, carbs: 78, protein: 0.5, fat: 0, fiber: 0 },

  // ── Flour & Baking ──
  'flour': { calories: 364, carbs: 76.3, protein: 10.3, fat: 1, fiber: 2.7 },
  'all purpose flour': { calories: 364, carbs: 76.3, protein: 10.3, fat: 1, fiber: 2.7 },
  'all-purpose flour': { calories: 364, carbs: 76.3, protein: 10.3, fat: 1, fiber: 2.7 },
  'bread flour': { calories: 361, carbs: 72, protein: 12.9, fat: 1.7, fiber: 2.4 },
  'cake flour': { calories: 362, carbs: 79, protein: 8, fat: 0.8, fiber: 1.7 },
  'whole wheat flour': { calories: 340, carbs: 72.6, protein: 13.2, fat: 2.5, fiber: 10.7 },
  'almond flour': { calories: 571, carbs: 19.7, protein: 21.4, fat: 50.6, fiber: 10.4 },
  'coconut flour': { calories: 443, carbs: 60, protein: 19.3, fat: 14.7, fiber: 39.1 },
  'tapioca starch': { calories: 358, carbs: 88.7, protein: 0.2, fat: 0, fiber: 0.9 },
  'tapioca flour': { calories: 358, carbs: 88.7, protein: 0.2, fat: 0, fiber: 0.9 },
  'cornstarch': { calories: 381, carbs: 91.3, protein: 0.3, fat: 0.1, fiber: 0.9 },
  'corn starch': { calories: 381, carbs: 91.3, protein: 0.3, fat: 0.1, fiber: 0.9 },
  'potato starch': { calories: 333, carbs: 83.1, protein: 0.1, fat: 0, fiber: 0 },
  'baking powder': { calories: 53, carbs: 27.7, protein: 0, fat: 0, fiber: 0 },
  'baking soda': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'yeast': { calories: 325, carbs: 41.2, protein: 40.4, fat: 6.2, fiber: 26.9 },
  'active dry yeast': { calories: 325, carbs: 41.2, protein: 40.4, fat: 6.2, fiber: 26.9 },
  'instant yeast': { calories: 325, carbs: 41.2, protein: 40.4, fat: 6.2, fiber: 26.9 },
  'cocoa powder': { calories: 228, carbs: 57.9, protein: 19.6, fat: 13.7, fiber: 37 },
  'chocolate chips': { calories: 502, carbs: 59.4, protein: 5.5, fat: 30.2, fiber: 5.9 },
  'dark chocolate': { calories: 546, carbs: 59.4, protein: 5.5, fat: 31.3, fiber: 7 },
  'white chocolate': { calories: 539, carbs: 59.2, protein: 5.9, fat: 32.1, fiber: 0.2 },
  'gelatin': { calories: 335, carbs: 0, protein: 85.6, fat: 0.1, fiber: 0 },
  'protein powder': { calories: 375, carbs: 13, protein: 75, fat: 3.5, fiber: 0 },
  'whey protein': { calories: 375, carbs: 13, protein: 75, fat: 3.5, fiber: 0 },
  'vanilla extract': { calories: 288, carbs: 12.7, protein: 0.1, fat: 0.1, fiber: 0 },
  'vanilla': { calories: 288, carbs: 12.7, protein: 0.1, fat: 0.1, fiber: 0 },
  'matcha': { calories: 324, carbs: 44.3, protein: 30.6, fat: 5.3, fiber: 38.5 },
  'matcha powder': { calories: 324, carbs: 44.3, protein: 30.6, fat: 5.3, fiber: 38.5 },

  // ── Dairy ──
  'milk': { calories: 61, carbs: 4.8, protein: 3.2, fat: 3.3, fiber: 0 },
  'whole milk': { calories: 61, carbs: 4.8, protein: 3.2, fat: 3.3, fiber: 0 },
  'skim milk': { calories: 35, carbs: 5, protein: 3.4, fat: 0.1, fiber: 0 },
  '2% milk': { calories: 50, carbs: 4.7, protein: 3.3, fat: 2, fiber: 0 },
  'heavy cream': { calories: 345, carbs: 2.8, protein: 2.1, fat: 37, fiber: 0 },
  'heavy whipping cream': { calories: 345, carbs: 2.8, protein: 2.1, fat: 37, fiber: 0 },
  'whipping cream': { calories: 345, carbs: 2.8, protein: 2.1, fat: 37, fiber: 0 },
  'half and half': { calories: 131, carbs: 4.3, protein: 2.9, fat: 11.5, fiber: 0 },
  'half-and-half': { calories: 131, carbs: 4.3, protein: 2.9, fat: 11.5, fiber: 0 },
  'butter': { calories: 717, carbs: 0.1, protein: 0.9, fat: 81, fiber: 0 },
  'unsalted butter': { calories: 717, carbs: 0.1, protein: 0.9, fat: 81, fiber: 0 },
  'salted butter': { calories: 717, carbs: 0.1, protein: 0.9, fat: 81, fiber: 0 },
  'ghee': { calories: 900, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'cream cheese': { calories: 342, carbs: 4.1, protein: 5.9, fat: 34.2, fiber: 0 },
  'greek yogurt': { calories: 97, carbs: 3.6, protein: 9, fat: 5, fiber: 0 },
  'yogurt': { calories: 63, carbs: 5, protein: 5.3, fat: 1.5, fiber: 0 },
  'sour cream': { calories: 198, carbs: 4.6, protein: 2.4, fat: 19.4, fiber: 0 },
  'cheddar cheese': { calories: 403, carbs: 1.3, protein: 24.9, fat: 33.1, fiber: 0 },
  'cheddar': { calories: 403, carbs: 1.3, protein: 24.9, fat: 33.1, fiber: 0 },
  'mozzarella': { calories: 280, carbs: 2.2, protein: 22.2, fat: 22.4, fiber: 0 },
  'mozzarella cheese': { calories: 280, carbs: 2.2, protein: 22.2, fat: 22.4, fiber: 0 },
  'parmesan': { calories: 431, carbs: 3.2, protein: 38.5, fat: 28.6, fiber: 0 },
  'parmesan cheese': { calories: 431, carbs: 3.2, protein: 38.5, fat: 28.6, fiber: 0 },
  'ricotta': { calories: 174, carbs: 3, protein: 11.3, fat: 13, fiber: 0 },
  'feta': { calories: 264, carbs: 4.1, protein: 14.2, fat: 21.3, fiber: 0 },
  'goat cheese': { calories: 364, carbs: 0.1, protein: 21.6, fat: 29.8, fiber: 0 },
  'swiss cheese': { calories: 380, carbs: 5.4, protein: 27, fat: 28, fiber: 0 },
  'monterey jack': { calories: 373, carbs: 0.7, protein: 24.5, fat: 30.3, fiber: 0 },
  'pepper jack': { calories: 373, carbs: 0.7, protein: 24.5, fat: 30.3, fiber: 0 },
  'cheese': { calories: 350, carbs: 2, protein: 25, fat: 28, fiber: 0 },
  'cottage cheese': { calories: 98, carbs: 3.4, protein: 11.1, fat: 4.3, fiber: 0 },
  'mascarpone': { calories: 429, carbs: 3.5, protein: 4.8, fat: 44.6, fiber: 0 },
  'condensed milk': { calories: 321, carbs: 54.4, protein: 7.9, fat: 8.7, fiber: 0 },
  'sweetened condensed milk': { calories: 321, carbs: 54.4, protein: 7.9, fat: 8.7, fiber: 0 },
  'evaporated milk': { calories: 134, carbs: 10, protein: 6.8, fat: 7.6, fiber: 0 },
  'buttermilk': { calories: 40, carbs: 4.8, protein: 3.3, fat: 0.9, fiber: 0 },

  // ── Plant Milks ──
  'coconut milk': { calories: 230, carbs: 6, protein: 2.3, fat: 23.8, fiber: 0 },
  'coconut cream': { calories: 330, carbs: 6.6, protein: 3.6, fat: 34.7, fiber: 0 },
  'coconut milk canned': { calories: 197, carbs: 4.2, protein: 2.2, fat: 21.3, fiber: 0 },
  'almond milk': { calories: 15, carbs: 0.6, protein: 0.6, fat: 1.1, fiber: 0.2 },
  'oat milk': { calories: 43, carbs: 7, protein: 1, fat: 1.4, fiber: 0.8 },
  'soy milk': { calories: 33, carbs: 1.8, protein: 2.8, fat: 1.6, fiber: 0.4 },

  // ── Oils & Fats ──
  'olive oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'extra virgin olive oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'vegetable oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'canola oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'avocado oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'coconut oil': { calories: 862, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'sesame oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'toasted sesame oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'peanut oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'cooking oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'cooking spray': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'lard': { calories: 902, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'shortening': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },

  // ── Nut Butters & Nuts ──
  'peanut butter': { calories: 588, carbs: 20, protein: 25, fat: 50, fiber: 6 },
  'almond butter': { calories: 614, carbs: 18.8, protein: 21, fat: 55.5, fiber: 10.5 },
  'tahini': { calories: 595, carbs: 21.2, protein: 17, fat: 53.8, fiber: 9.3 },
  'sesame paste': { calories: 595, carbs: 21.2, protein: 17, fat: 53.8, fiber: 9.3 },
  'peanuts': { calories: 567, carbs: 16.1, protein: 25.8, fat: 49.2, fiber: 8.5 },
  'almonds': { calories: 579, carbs: 21.6, protein: 21.2, fat: 49.9, fiber: 12.5 },
  'walnuts': { calories: 654, carbs: 13.7, protein: 15.2, fat: 65.2, fiber: 6.7 },
  'cashews': { calories: 553, carbs: 30.2, protein: 18.2, fat: 43.9, fiber: 3.3 },
  'pecans': { calories: 691, carbs: 13.9, protein: 9.2, fat: 72, fiber: 9.6 },
  'pistachios': { calories: 560, carbs: 27.2, protein: 20.2, fat: 45.3, fiber: 10.6 },
  'pine nuts': { calories: 673, carbs: 13.1, protein: 13.7, fat: 68.4, fiber: 3.7 },
  'macadamia nuts': { calories: 718, carbs: 13.8, protein: 7.9, fat: 75.8, fiber: 8.6 },
  'hazelnuts': { calories: 628, carbs: 16.7, protein: 15, fat: 60.8, fiber: 9.7 },
  'chestnuts': { calories: 213, carbs: 45.5, protein: 2.4, fat: 2.3, fiber: 8.1 },
  'shredded coconut': { calories: 660, carbs: 23.7, protein: 6.9, fat: 64.5, fiber: 16.3 },
  'desiccated coconut': { calories: 660, carbs: 23.7, protein: 6.9, fat: 64.5, fiber: 16.3 },
  'coconut flakes': { calories: 660, carbs: 23.7, protein: 6.9, fat: 64.5, fiber: 16.3 },

  // ── Seeds ──
  'chia seeds': { calories: 486, carbs: 42.1, protein: 16.5, fat: 30.7, fiber: 34.4 },
  'chia': { calories: 486, carbs: 42.1, protein: 16.5, fat: 30.7, fiber: 34.4 },
  'flax seeds': { calories: 534, carbs: 28.9, protein: 18.3, fat: 42.2, fiber: 27.3 },
  'flaxseed': { calories: 534, carbs: 28.9, protein: 18.3, fat: 42.2, fiber: 27.3 },
  'hemp seeds': { calories: 553, carbs: 8.7, protein: 31.6, fat: 48.8, fiber: 4 },
  'sunflower seeds': { calories: 584, carbs: 20, protein: 20.8, fat: 51.5, fiber: 8.6 },
  'pumpkin seeds': { calories: 559, carbs: 10.7, protein: 30.2, fat: 49.1, fiber: 6 },
  'sesame seeds': { calories: 573, carbs: 23.4, protein: 17.7, fat: 49.7, fiber: 11.8 },
  'poppy seeds': { calories: 525, carbs: 28.1, protein: 18, fat: 41.6, fiber: 19.5 },

  // ── Sweeteners ──
  'sugar': { calories: 387, carbs: 100, protein: 0, fat: 0, fiber: 0 },
  'white sugar': { calories: 387, carbs: 100, protein: 0, fat: 0, fiber: 0 },
  'granulated sugar': { calories: 387, carbs: 100, protein: 0, fat: 0, fiber: 0 },
  'brown sugar': { calories: 380, carbs: 98.1, protein: 0, fat: 0, fiber: 0 },
  'powdered sugar': { calories: 389, carbs: 100, protein: 0, fat: 0, fiber: 0 },
  'confectioners sugar': { calories: 389, carbs: 100, protein: 0, fat: 0, fiber: 0 },
  'honey': { calories: 304, carbs: 82.4, protein: 0.3, fat: 0, fiber: 0.2 },
  'maple syrup': { calories: 260, carbs: 67, protein: 0, fat: 0.1, fiber: 0 },
  'agave': { calories: 310, carbs: 76.4, protein: 0, fat: 0.5, fiber: 0.2 },
  'corn syrup': { calories: 286, carbs: 77.6, protein: 0, fat: 0, fiber: 0 },
  'molasses': { calories: 290, carbs: 74.7, protein: 0, fat: 0.1, fiber: 0 },
  'stevia': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'palm sugar': { calories: 375, carbs: 93.8, protein: 1.1, fat: 0, fiber: 0 },
  'coconut sugar': { calories: 375, carbs: 94, protein: 1, fat: 0.5, fiber: 0 },
  'rock sugar': { calories: 387, carbs: 100, protein: 0, fat: 0, fiber: 0 },

  // ── Condiments & Sauces ──
  'soy sauce': { calories: 53, carbs: 4.9, protein: 8.1, fat: 0, fiber: 0.8 },
  'light soy sauce': { calories: 53, carbs: 4.9, protein: 8.1, fat: 0, fiber: 0.8 },
  'dark soy sauce': { calories: 60, carbs: 9.3, protein: 5.6, fat: 0, fiber: 0.8 },
  'tamari': { calories: 60, carbs: 5.2, protein: 10.5, fat: 0.1, fiber: 0.5 },
  'fish sauce': { calories: 35, carbs: 3.6, protein: 5.1, fat: 0, fiber: 0 },
  'oyster sauce': { calories: 51, carbs: 11, protein: 1.4, fat: 0, fiber: 0 },
  'hoisin sauce': { calories: 220, carbs: 44, protein: 3.3, fat: 3.4, fiber: 2 },
  'sriracha': { calories: 93, carbs: 18.5, protein: 2.4, fat: 0.9, fiber: 1.8 },
  'chili sauce': { calories: 93, carbs: 18.5, protein: 2.4, fat: 0.9, fiber: 1.8 },
  'sweet chili sauce': { calories: 220, carbs: 53, protein: 0.3, fat: 0.4, fiber: 0.5 },
  'gochujang': { calories: 228, carbs: 45.3, protein: 5, fat: 2.9, fiber: 3.5 },
  'gochugaru': { calories: 281, carbs: 55.8, protein: 12, fat: 5.7, fiber: 24.9 },
  'korean chili flakes': { calories: 281, carbs: 55.8, protein: 12, fat: 5.7, fiber: 24.9 },
  'doenjang': { calories: 199, carbs: 17, protein: 13, fat: 9, fiber: 5.4 },
  'miso': { calories: 199, carbs: 26.5, protein: 12.8, fat: 6, fiber: 5.4 },
  'miso paste': { calories: 199, carbs: 26.5, protein: 12.8, fat: 6, fiber: 5.4 },
  'curry paste': { calories: 94, carbs: 9, protein: 2.2, fat: 5.5, fiber: 3.3 },
  'red curry paste': { calories: 94, carbs: 9, protein: 2.2, fat: 5.5, fiber: 3.3 },
  'green curry paste': { calories: 94, carbs: 9, protein: 2.2, fat: 5.5, fiber: 3.3 },
  'yellow curry paste': { calories: 94, carbs: 9, protein: 2.2, fat: 5.5, fiber: 3.3 },
  'curry powder': { calories: 325, carbs: 55.8, protein: 14.3, fat: 14.0, fiber: 33.2 },
  'ketchup': { calories: 112, carbs: 25.8, protein: 1.7, fat: 0.4, fiber: 0.3 },
  'tomato paste': { calories: 82, carbs: 18.9, protein: 4.3, fat: 0.5, fiber: 4.1 },
  'tomato sauce': { calories: 29, carbs: 5.4, protein: 1.3, fat: 0.2, fiber: 1.5 },
  'salsa': { calories: 36, carbs: 7, protein: 1.5, fat: 0.2, fiber: 1.5 },
  'mustard': { calories: 66, carbs: 5.8, protein: 4.4, fat: 3.3, fiber: 3.3 },
  'dijon mustard': { calories: 66, carbs: 5.8, protein: 4.4, fat: 3.3, fiber: 3.3 },
  'mayonnaise': { calories: 680, carbs: 0.6, protein: 1, fat: 75, fiber: 0 },
  'mayo': { calories: 680, carbs: 0.6, protein: 1, fat: 75, fiber: 0 },
  'vinegar': { calories: 21, carbs: 0.9, protein: 0, fat: 0, fiber: 0 },
  'rice vinegar': { calories: 18, carbs: 0.04, protein: 0, fat: 0, fiber: 0 },
  'apple cider vinegar': { calories: 21, carbs: 0.9, protein: 0, fat: 0, fiber: 0 },
  'balsamic vinegar': { calories: 88, carbs: 17, protein: 0.5, fat: 0, fiber: 0 },
  'mirin': { calories: 241, carbs: 45, protein: 0.3, fat: 0, fiber: 0 },
  'rice wine': { calories: 134, carbs: 5, protein: 0.5, fat: 0, fiber: 0 },
  'shaoxing wine': { calories: 134, carbs: 5, protein: 0.5, fat: 0, fiber: 0 },
  'sake': { calories: 134, carbs: 5, protein: 0.5, fat: 0, fiber: 0 },
  'cooking wine': { calories: 134, carbs: 5, protein: 0.5, fat: 0, fiber: 0 },
  'worcestershire sauce': { calories: 78, carbs: 19.5, protein: 0, fat: 0, fiber: 0 },
  'hot sauce': { calories: 11, carbs: 1.8, protein: 0.6, fat: 0.4, fiber: 0.7 },
  'chili oil': { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 },
  'chili crisp': { calories: 750, carbs: 5, protein: 3, fat: 80, fiber: 3 },
  'lao gan ma': { calories: 750, carbs: 5, protein: 3, fat: 80, fiber: 3 },
  'sambal': { calories: 93, carbs: 18, protein: 2, fat: 1, fiber: 2 },
  'sambal oelek': { calories: 93, carbs: 18, protein: 2, fat: 1, fiber: 2 },
  'teriyaki sauce': { calories: 89, carbs: 16, protein: 5.9, fat: 0, fiber: 0.1 },
  'bbq sauce': { calories: 172, carbs: 40.8, protein: 0.8, fat: 0.6, fiber: 0.6 },
  'barbecue sauce': { calories: 172, carbs: 40.8, protein: 0.8, fat: 0.6, fiber: 0.6 },
  'pesto': { calories: 418, carbs: 5.1, protein: 8, fat: 41.7, fiber: 2.4 },
  'marinara sauce': { calories: 51, carbs: 7.5, protein: 1.3, fat: 1.8, fiber: 1.5 },

  // ── Produce: Vegetables ──
  'onion': { calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1, fiber: 1.7 },
  'onions': { calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1, fiber: 1.7 },
  'yellow onion': { calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1, fiber: 1.7 },
  'red onion': { calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1, fiber: 1.7 },
  'white onion': { calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1, fiber: 1.7 },
  'green onion': { calories: 32, carbs: 7.3, protein: 1.8, fat: 0.2, fiber: 2.6 },
  'green onions': { calories: 32, carbs: 7.3, protein: 1.8, fat: 0.2, fiber: 2.6 },
  'scallion': { calories: 32, carbs: 7.3, protein: 1.8, fat: 0.2, fiber: 2.6 },
  'scallions': { calories: 32, carbs: 7.3, protein: 1.8, fat: 0.2, fiber: 2.6 },
  'shallot': { calories: 72, carbs: 16.8, protein: 2.5, fat: 0.1, fiber: 3.2 },
  'shallots': { calories: 72, carbs: 16.8, protein: 2.5, fat: 0.1, fiber: 3.2 },
  'garlic': { calories: 149, carbs: 33.1, protein: 6.4, fat: 0.5, fiber: 2.1 },
  'ginger': { calories: 80, carbs: 17.8, protein: 1.8, fat: 0.8, fiber: 2 },
  'fresh ginger': { calories: 80, carbs: 17.8, protein: 1.8, fat: 0.8, fiber: 2 },
  'galangal': { calories: 80, carbs: 17.8, protein: 1.8, fat: 0.8, fiber: 2 },
  'lemongrass': { calories: 99, carbs: 25.3, protein: 1.8, fat: 0.5, fiber: 0 },
  'tomato': { calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, fiber: 1.2 },
  'tomatoes': { calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, fiber: 1.2 },
  'cherry tomatoes': { calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, fiber: 1.2 },
  'carrot': { calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2, fiber: 2.8 },
  'carrots': { calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2, fiber: 2.8 },
  'celery': { calories: 16, carbs: 3, protein: 0.7, fat: 0.2, fiber: 1.6 },
  'bell pepper': { calories: 26, carbs: 6.3, protein: 0.9, fat: 0.2, fiber: 1.7 },
  'bell peppers': { calories: 26, carbs: 6.3, protein: 0.9, fat: 0.2, fiber: 1.7 },
  'red bell pepper': { calories: 26, carbs: 6.3, protein: 0.9, fat: 0.2, fiber: 1.7 },
  'green bell pepper': { calories: 20, carbs: 4.6, protein: 0.9, fat: 0.2, fiber: 1.7 },
  'jalapeno': { calories: 29, carbs: 6.5, protein: 0.9, fat: 0.4, fiber: 2.8 },
  'jalapenos': { calories: 29, carbs: 6.5, protein: 0.9, fat: 0.4, fiber: 2.8 },
  'chili pepper': { calories: 40, carbs: 8.8, protein: 1.9, fat: 0.4, fiber: 1.5 },
  'thai chili': { calories: 40, carbs: 8.8, protein: 1.9, fat: 0.4, fiber: 1.5 },
  'serrano pepper': { calories: 32, carbs: 6.7, protein: 1.7, fat: 0.4, fiber: 3.7 },
  'habanero': { calories: 40, carbs: 8.8, protein: 1.9, fat: 0.4, fiber: 1.5 },
  'potato': { calories: 77, carbs: 17.5, protein: 2, fat: 0.1, fiber: 2.2 },
  'potatoes': { calories: 77, carbs: 17.5, protein: 2, fat: 0.1, fiber: 2.2 },
  'sweet potato': { calories: 86, carbs: 20.1, protein: 1.6, fat: 0.1, fiber: 3 },
  'sweet potatoes': { calories: 86, carbs: 20.1, protein: 1.6, fat: 0.1, fiber: 3 },
  'yam': { calories: 118, carbs: 27.9, protein: 1.5, fat: 0.2, fiber: 4.1 },
  'taro': { calories: 112, carbs: 26.5, protein: 1.5, fat: 0.2, fiber: 4.1 },
  'broccoli': { calories: 34, carbs: 6.6, protein: 2.8, fat: 0.4, fiber: 2.6 },
  'cauliflower': { calories: 25, carbs: 5, protein: 1.9, fat: 0.3, fiber: 2 },
  'cabbage': { calories: 25, carbs: 5.8, protein: 1.3, fat: 0.1, fiber: 2.5 },
  'napa cabbage': { calories: 13, carbs: 2.2, protein: 1.2, fat: 0.2, fiber: 1 },
  'chinese cabbage': { calories: 13, carbs: 2.2, protein: 1.2, fat: 0.2, fiber: 1 },
  'bok choy': { calories: 13, carbs: 2.2, protein: 1.5, fat: 0.2, fiber: 1 },
  'baby bok choy': { calories: 13, carbs: 2.2, protein: 1.5, fat: 0.2, fiber: 1 },
  'spinach': { calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, fiber: 2.2 },
  'kale': { calories: 49, carbs: 8.8, protein: 4.3, fat: 0.9, fiber: 3.6 },
  'lettuce': { calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2, fiber: 1.3 },
  'romaine lettuce': { calories: 17, carbs: 3.3, protein: 1.2, fat: 0.3, fiber: 2.1 },
  'arugula': { calories: 25, carbs: 3.7, protein: 2.6, fat: 0.7, fiber: 1.6 },
  'bean sprouts': { calories: 31, carbs: 5.9, protein: 3.2, fat: 0.2, fiber: 1.8 },
  'mung bean sprouts': { calories: 31, carbs: 5.9, protein: 3.2, fat: 0.2, fiber: 1.8 },
  'corn': { calories: 86, carbs: 19, protein: 3.3, fat: 1.4, fiber: 2.7 },
  'sweet corn': { calories: 86, carbs: 19, protein: 3.3, fat: 1.4, fiber: 2.7 },
  'peas': { calories: 81, carbs: 14.5, protein: 5.4, fat: 0.4, fiber: 5.1 },
  'green beans': { calories: 31, carbs: 7, protein: 1.8, fat: 0.1, fiber: 3.4 },
  'snap peas': { calories: 42, carbs: 7.5, protein: 2.8, fat: 0.2, fiber: 2.6 },
  'snow peas': { calories: 42, carbs: 7.5, protein: 2.8, fat: 0.2, fiber: 2.6 },
  'asparagus': { calories: 20, carbs: 3.9, protein: 2.2, fat: 0.1, fiber: 2.1 },
  'zucchini': { calories: 17, carbs: 3.1, protein: 1.2, fat: 0.3, fiber: 1 },
  'squash': { calories: 26, carbs: 6.5, protein: 1, fat: 0.1, fiber: 1.1 },
  'butternut squash': { calories: 45, carbs: 12, protein: 1, fat: 0.1, fiber: 2 },
  'kabocha squash': { calories: 26, carbs: 6.5, protein: 1, fat: 0.1, fiber: 1.1 },
  'eggplant': { calories: 25, carbs: 5.9, protein: 1, fat: 0.2, fiber: 3 },
  'cucumber': { calories: 15, carbs: 3.6, protein: 0.7, fat: 0.1, fiber: 0.5 },
  'mushroom': { calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3, fiber: 1 },
  'mushrooms': { calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3, fiber: 1 },
  'shiitake mushrooms': { calories: 34, carbs: 6.8, protein: 2.2, fat: 0.5, fiber: 2.5 },
  'shiitake': { calories: 34, carbs: 6.8, protein: 2.2, fat: 0.5, fiber: 2.5 },
  'dried shiitake': { calories: 296, carbs: 75.4, protein: 9.6, fat: 1, fiber: 11.5 },
  'enoki mushrooms': { calories: 37, carbs: 7.8, protein: 2.7, fat: 0.3, fiber: 2.7 },
  'king oyster mushroom': { calories: 35, carbs: 6.1, protein: 3.3, fat: 0.4, fiber: 2.0 },
  'wood ear mushroom': { calories: 25, carbs: 5.5, protein: 0.5, fat: 0.1, fiber: 5.0 },
  'daikon': { calories: 18, carbs: 4.1, protein: 0.7, fat: 0.1, fiber: 1.6 },
  'daikon radish': { calories: 18, carbs: 4.1, protein: 0.7, fat: 0.1, fiber: 1.6 },
  'radish': { calories: 16, carbs: 3.4, protein: 0.7, fat: 0.1, fiber: 1.6 },
  'korean radish': { calories: 21, carbs: 4.8, protein: 0.8, fat: 0.1, fiber: 1.4 },
  'bamboo shoots': { calories: 27, carbs: 5.2, protein: 2.6, fat: 0.3, fiber: 2.2 },
  'water chestnuts': { calories: 97, carbs: 23.9, protein: 1.4, fat: 0.1, fiber: 3 },
  'lotus root': { calories: 74, carbs: 17.2, protein: 2.6, fat: 0.1, fiber: 4.9 },
  'bitter melon': { calories: 17, carbs: 3.7, protein: 1, fat: 0.2, fiber: 2.8 },
  'choy sum': { calories: 13, carbs: 2.2, protein: 1.2, fat: 0.2, fiber: 1 },
  'chinese broccoli': { calories: 26, carbs: 3.9, protein: 2.7, fat: 0.5, fiber: 2.8 },
  'gai lan': { calories: 26, carbs: 3.9, protein: 2.7, fat: 0.5, fiber: 2.8 },
  'morning glory': { calories: 19, carbs: 3.1, protein: 2.6, fat: 0.2, fiber: 2.1 },
  'water spinach': { calories: 19, carbs: 3.1, protein: 2.6, fat: 0.2, fiber: 2.1 },
  'kangkong': { calories: 19, carbs: 3.1, protein: 2.6, fat: 0.2, fiber: 2.1 },
  'perilla leaves': { calories: 37, carbs: 7, protein: 3.5, fat: 0.1, fiber: 3.4 },
  'kimchi': { calories: 15, carbs: 2.4, protein: 1.1, fat: 0.5, fiber: 1.6 },
  'pickled radish': { calories: 28, carbs: 6.5, protein: 0.6, fat: 0.1, fiber: 1 },
  'seaweed': { calories: 45, carbs: 9, protein: 5.1, fat: 0.6, fiber: 0.5 },
  'nori': { calories: 35, carbs: 5.1, protein: 5.8, fat: 0.3, fiber: 0 },
  'dried seaweed': { calories: 306, carbs: 56, protein: 22.5, fat: 2.1, fiber: 3.6 },
  'kelp': { calories: 43, carbs: 9.6, protein: 1.7, fat: 0.6, fiber: 1.3 },
  'wakame': { calories: 45, carbs: 9.1, protein: 3, fat: 0.6, fiber: 0.5 },

  // ── Produce: Fruits ──
  'banana': { calories: 89, carbs: 22.8, protein: 1.1, fat: 0.3, fiber: 2.6 },
  'apple': { calories: 52, carbs: 13.8, protein: 0.3, fat: 0.2, fiber: 2.4 },
  'orange': { calories: 47, carbs: 11.8, protein: 0.9, fat: 0.1, fiber: 2.4 },
  'lemon': { calories: 29, carbs: 9.3, protein: 1.1, fat: 0.3, fiber: 2.8 },
  'lemon juice': { calories: 22, carbs: 6.9, protein: 0.4, fat: 0.2, fiber: 0.3 },
  'lime': { calories: 30, carbs: 10.5, protein: 0.7, fat: 0.2, fiber: 2.8 },
  'lime juice': { calories: 25, carbs: 8.4, protein: 0.4, fat: 0.1, fiber: 0.4 },
  'strawberry': { calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, fiber: 2 },
  'strawberries': { calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, fiber: 2 },
  'blueberry': { calories: 57, carbs: 14.5, protein: 0.7, fat: 0.3, fiber: 2.4 },
  'blueberries': { calories: 57, carbs: 14.5, protein: 0.7, fat: 0.3, fiber: 2.4 },
  'raspberry': { calories: 52, carbs: 11.9, protein: 1.2, fat: 0.7, fiber: 6.5 },
  'raspberries': { calories: 52, carbs: 11.9, protein: 1.2, fat: 0.7, fiber: 6.5 },
  'blackberry': { calories: 43, carbs: 9.6, protein: 1.4, fat: 0.5, fiber: 5.3 },
  'blackberries': { calories: 43, carbs: 9.6, protein: 1.4, fat: 0.5, fiber: 5.3 },
  'mango': { calories: 60, carbs: 15, protein: 0.8, fat: 0.4, fiber: 1.6 },
  'pineapple': { calories: 50, carbs: 13.1, protein: 0.5, fat: 0.1, fiber: 1.4 },
  'peach': { calories: 39, carbs: 9.5, protein: 0.9, fat: 0.3, fiber: 1.5 },
  'avocado': { calories: 160, carbs: 8.5, protein: 2, fat: 14.7, fiber: 6.7 },
  'grape': { calories: 69, carbs: 18.1, protein: 0.7, fat: 0.2, fiber: 0.9 },
  'grapes': { calories: 69, carbs: 18.1, protein: 0.7, fat: 0.2, fiber: 0.9 },
  'watermelon': { calories: 30, carbs: 7.6, protein: 0.6, fat: 0.2, fiber: 0.4 },
  'coconut': { calories: 354, carbs: 15.2, protein: 3.3, fat: 33.5, fiber: 9 },
  'raisins': { calories: 299, carbs: 79.2, protein: 3.1, fat: 0.5, fiber: 3.7 },
  'dried cranberries': { calories: 308, carbs: 82, protein: 0.1, fat: 1.4, fiber: 5.7 },
  'dates': { calories: 277, carbs: 75, protein: 1.8, fat: 0.2, fiber: 6.7 },
  'dragon fruit': { calories: 60, carbs: 13, protein: 1.2, fat: 0.4, fiber: 3 },
  'lychee': { calories: 66, carbs: 16.5, protein: 0.8, fat: 0.4, fiber: 1.3 },
  'longan': { calories: 60, carbs: 15.1, protein: 1.3, fat: 0.1, fiber: 1.1 },
  'persimmon': { calories: 70, carbs: 18.6, protein: 0.6, fat: 0.2, fiber: 3.6 },
  'jackfruit': { calories: 95, carbs: 23.3, protein: 1.7, fat: 0.6, fiber: 1.5 },
  'durian': { calories: 147, carbs: 27.1, protein: 1.5, fat: 5.3, fiber: 3.8 },
  'plantain': { calories: 122, carbs: 31.9, protein: 1.3, fat: 0.4, fiber: 2.3 },
  'passion fruit': { calories: 97, carbs: 23.4, protein: 2.2, fat: 0.7, fiber: 10.4 },
  'guava': { calories: 68, carbs: 14.3, protein: 2.6, fat: 1, fiber: 5.4 },
  'papaya': { calories: 43, carbs: 10.8, protein: 0.5, fat: 0.3, fiber: 1.7 },
  'kiwi': { calories: 61, carbs: 14.7, protein: 1.1, fat: 0.5, fiber: 3 },
  'pear': { calories: 57, carbs: 15.2, protein: 0.4, fat: 0.1, fiber: 3.1 },
  'plum': { calories: 46, carbs: 11.4, protein: 0.7, fat: 0.3, fiber: 1.4 },
  'fig': { calories: 74, carbs: 19.2, protein: 0.8, fat: 0.3, fiber: 2.9 },
  'cranberries': { calories: 46, carbs: 12.2, protein: 0.4, fat: 0.1, fiber: 4.6 },
  'pomegranate': { calories: 83, carbs: 18.7, protein: 1.7, fat: 1.2, fiber: 4 },
  'jujube': { calories: 79, carbs: 20.2, protein: 1.2, fat: 0.2, fiber: 0 },
  'red dates': { calories: 287, carbs: 73.6, protein: 3.7, fat: 0.4, fiber: 7.7 },

  // ── Legumes ──
  'black beans': { calories: 132, carbs: 23.7, protein: 8.9, fat: 0.5, fiber: 8.7 },
  'kidney beans': { calories: 127, carbs: 22.8, protein: 8.7, fat: 0.5, fiber: 6.4 },
  'chickpeas': { calories: 164, carbs: 27.4, protein: 8.9, fat: 2.6, fiber: 7.6 },
  'garbanzo beans': { calories: 164, carbs: 27.4, protein: 8.9, fat: 2.6, fiber: 7.6 },
  'lentils': { calories: 116, carbs: 20.1, protein: 9, fat: 0.4, fiber: 7.9 },
  'pinto beans': { calories: 143, carbs: 26.2, protein: 9, fat: 0.7, fiber: 9 },
  'white beans': { calories: 139, carbs: 25.1, protein: 9.7, fat: 0.4, fiber: 6.3 },
  'cannellini beans': { calories: 139, carbs: 25.1, protein: 9.7, fat: 0.4, fiber: 6.3 },
  'soybeans': { calories: 173, carbs: 9.9, protein: 16.6, fat: 9, fiber: 6 },
  'mung beans': { calories: 105, carbs: 19.2, protein: 7.1, fat: 0.4, fiber: 7.6 },
  'red beans': { calories: 128, carbs: 22.3, protein: 8.7, fat: 0.5, fiber: 7.3 },
  'adzuki beans': { calories: 128, carbs: 24.8, protein: 7.5, fat: 0.1, fiber: 7.3 },
  'red bean paste': { calories: 239, carbs: 50, protein: 5.6, fat: 0.2, fiber: 4.4 },

  // ── Herbs & Spices ──
  'cilantro': { calories: 23, carbs: 3.7, protein: 2.1, fat: 0.5, fiber: 2.8 },
  'parsley': { calories: 36, carbs: 6.3, protein: 3, fat: 0.8, fiber: 3.3 },
  'basil': { calories: 23, carbs: 2.6, protein: 3.2, fat: 0.6, fiber: 1.6 },
  'thai basil': { calories: 23, carbs: 2.6, protein: 3.2, fat: 0.6, fiber: 1.6 },
  'mint': { calories: 44, carbs: 8.4, protein: 3.3, fat: 0.7, fiber: 6.8 },
  'dill': { calories: 43, carbs: 7, protein: 3.5, fat: 1.1, fiber: 2.1 },
  'rosemary': { calories: 131, carbs: 20.7, protein: 3.3, fat: 5.9, fiber: 14.1 },
  'thyme': { calories: 101, carbs: 24.5, protein: 5.6, fat: 1.7, fiber: 14 },
  'oregano': { calories: 265, carbs: 69, protein: 9, fat: 4.3, fiber: 42.5 },
  'cumin': { calories: 375, carbs: 44.2, protein: 17.8, fat: 22.3, fiber: 10.5 },
  'coriander': { calories: 298, carbs: 55, protein: 12.4, fat: 17.8, fiber: 41.9 },
  'turmeric': { calories: 312, carbs: 67.1, protein: 9.7, fat: 3.3, fiber: 22.7 },
  'paprika': { calories: 282, carbs: 54, protein: 14.1, fat: 13, fiber: 34.9 },
  'smoked paprika': { calories: 282, carbs: 54, protein: 14.1, fat: 13, fiber: 34.9 },
  'cayenne pepper': { calories: 318, carbs: 56.6, protein: 12.3, fat: 17.3, fiber: 27.2 },
  'black pepper': { calories: 251, carbs: 64, protein: 10.4, fat: 3.3, fiber: 25.3 },
  'pepper': { calories: 251, carbs: 64, protein: 10.4, fat: 3.3, fiber: 25.3 },
  'white pepper': { calories: 296, carbs: 68.6, protein: 10.4, fat: 2.1, fiber: 26.2 },
  'cinnamon': { calories: 247, carbs: 80.6, protein: 4, fat: 1.2, fiber: 53.1 },
  'nutmeg': { calories: 525, carbs: 49.3, protein: 5.8, fat: 36.3, fiber: 20.8 },
  'cloves': { calories: 274, carbs: 65.5, protein: 6, fat: 13, fiber: 33.9 },
  'cardamom': { calories: 311, carbs: 68.5, protein: 10.8, fat: 6.7, fiber: 28 },
  'star anise': { calories: 337, carbs: 50, protein: 17.6, fat: 15.9, fiber: 14.6 },
  'five spice': { calories: 300, carbs: 55, protein: 10, fat: 8, fiber: 20 },
  'chinese five spice': { calories: 300, carbs: 55, protein: 10, fat: 8, fiber: 20 },
  'sichuan peppercorn': { calories: 296, carbs: 50, protein: 10, fat: 10, fiber: 20 },
  'szechuan peppercorn': { calories: 296, carbs: 50, protein: 10, fat: 10, fiber: 20 },
  'red pepper flakes': { calories: 318, carbs: 56.6, protein: 12.3, fat: 17.3, fiber: 27.2 },
  'chili flakes': { calories: 318, carbs: 56.6, protein: 12.3, fat: 17.3, fiber: 27.2 },
  'chili powder': { calories: 282, carbs: 49.7, protein: 13.5, fat: 14.3, fiber: 34.8 },
  'garlic powder': { calories: 331, carbs: 72.7, protein: 16.6, fat: 0.7, fiber: 9 },
  'onion powder': { calories: 341, carbs: 79.1, protein: 10.4, fat: 1.1, fiber: 15.2 },
  'ginger powder': { calories: 335, carbs: 71.6, protein: 9, fat: 4.2, fiber: 14.1 },
  'ground ginger': { calories: 335, carbs: 71.6, protein: 9, fat: 4.2, fiber: 14.1 },
  'bay leaf': { calories: 313, carbs: 74.9, protein: 7.6, fat: 8.4, fiber: 26.3 },
  'bay leaves': { calories: 313, carbs: 74.9, protein: 7.6, fat: 8.4, fiber: 26.3 },
  'kaffir lime leaves': { calories: 30, carbs: 10.5, protein: 0.7, fat: 0.2, fiber: 2.8 },
  'salt': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'sea salt': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'kosher salt': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'msg': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'water': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'ice': { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  'broth': { calories: 7, carbs: 0.5, protein: 1, fat: 0.2, fiber: 0 },
  'chicken broth': { calories: 7, carbs: 0.5, protein: 1, fat: 0.2, fiber: 0 },
  'chicken stock': { calories: 7, carbs: 0.5, protein: 1, fat: 0.2, fiber: 0 },
  'beef broth': { calories: 8, carbs: 0.5, protein: 1.1, fat: 0.2, fiber: 0 },
  'beef stock': { calories: 8, carbs: 0.5, protein: 1.1, fat: 0.2, fiber: 0 },
  'vegetable broth': { calories: 6, carbs: 1.1, protein: 0.2, fat: 0, fiber: 0 },
  'dashi': { calories: 3, carbs: 0.3, protein: 0.4, fat: 0, fiber: 0 },
  'bone broth': { calories: 15, carbs: 0.5, protein: 2.5, fat: 0.5, fiber: 0 },
  'stock': { calories: 7, carbs: 0.5, protein: 1, fat: 0.2, fiber: 0 },

  // ── Canned/Preserved ──
  'canned tomatoes': { calories: 20, carbs: 3.6, protein: 1, fat: 0.2, fiber: 1 },
  'diced tomatoes': { calories: 20, carbs: 3.6, protein: 1, fat: 0.2, fiber: 1 },
  'crushed tomatoes': { calories: 32, carbs: 7.3, protein: 1.6, fat: 0.3, fiber: 1.9 },
  'sun dried tomatoes': { calories: 258, carbs: 55.8, protein: 14.1, fat: 3, fiber: 12.3 },
  'olives': { calories: 115, carbs: 6, protein: 0.8, fat: 10.7, fiber: 3.2 },
  'capers': { calories: 23, carbs: 2.4, protein: 2.4, fat: 0.9, fiber: 3.2 },
  'pickles': { calories: 11, carbs: 2.3, protein: 0.3, fat: 0.2, fiber: 1.2 },

  // ── Misc ──
  'jam': { calories: 250, carbs: 65, protein: 0.4, fat: 0.1, fiber: 0.9 },
  'peanut sauce': { calories: 200, carbs: 15, protein: 7, fat: 13, fiber: 2 },
  'coconut aminos': { calories: 20, carbs: 5, protein: 0, fat: 0, fiber: 0 },
  'tamarind paste': { calories: 239, carbs: 62.5, protein: 2.8, fat: 0.6, fiber: 5.1 },
  'tamarind': { calories: 239, carbs: 62.5, protein: 2.8, fat: 0.6, fiber: 5.1 },
  'fermented black beans': { calories: 199, carbs: 17, protein: 13, fat: 9, fiber: 5.4 },
  'black bean sauce': { calories: 78, carbs: 12.8, protein: 3.5, fat: 1.3, fiber: 1.2 },
  'xo sauce': { calories: 450, carbs: 10, protein: 15, fat: 40, fiber: 0 },
  'char siu sauce': { calories: 220, carbs: 52, protein: 3, fat: 0.5, fiber: 0 },
  'plum sauce': { calories: 184, carbs: 46, protein: 0, fat: 0, fiber: 0.4 },
  'satay sauce': { calories: 200, carbs: 15, protein: 7, fat: 13, fiber: 2 },
};

// ── Volume density lookup (g/ml) for density-aware conversions ──
// Only includes ingredients where deviation from water density is significant (>5%).
// Dairy near water density (milk, cream, buttermilk ≈ 1.0) intentionally omitted.
const VOLUME_DENSITY_G_PER_ML: Record<string, number> = {
  // Oils (~0.91-0.92 g/ml)
  'olive oil': 0.91, 'extra virgin olive oil': 0.91,
  'vegetable oil': 0.92, 'canola oil': 0.92, 'avocado oil': 0.91,
  'sesame oil': 0.91, 'toasted sesame oil': 0.91, 'peanut oil': 0.91,
  'coconut oil': 0.91, 'oil': 0.92, 'cooking oil': 0.92,
  'lard': 0.91, 'shortening': 0.88,

  // Butter / ghee (melted state density)
  'butter': 0.91, 'unsalted butter': 0.91, 'salted butter': 0.91, 'ghee': 0.91,

  // Nut butters (dense pastes)
  'peanut butter': 1.08, 'almond butter': 1.08, 'tahini': 1.02, 'sesame paste': 1.02,

  // Flours
  'flour': 0.53, 'all purpose flour': 0.53, 'all-purpose flour': 0.53,
  'bread flour': 0.55, 'cake flour': 0.48, 'whole wheat flour': 0.57,
  'almond flour': 0.37, 'coconut flour': 0.43, 'rice flour': 0.55,
  'glutinous rice flour': 0.55,

  // Starches and dry powders
  'cornstarch': 0.52, 'corn starch': 0.52,
  'tapioca starch': 0.50, 'tapioca flour': 0.50,
  'potato starch': 0.58,
  'cocoa powder': 0.35,
  'baking powder': 0.92,
  'matcha': 0.35, 'matcha powder': 0.35,

  // Oats and crumbs
  'oats': 0.37, 'rolled oats': 0.37, 'oatmeal': 0.37,
  'bread crumbs': 0.48, 'panko': 0.48,

  // Sweeteners — granular
  'sugar': 0.85, 'white sugar': 0.85, 'granulated sugar': 0.85,
  'powdered sugar': 0.50, 'confectioners sugar': 0.50,
  'brown sugar': 0.92,
  'coconut sugar': 0.80, 'palm sugar': 0.80,

  // Sweeteners — liquid (denser than water)
  'honey': 1.42, 'maple syrup': 1.32, 'molasses': 1.44,
  'agave': 1.43, 'corn syrup': 1.38, 'mirin': 1.03,

  // Condiments
  'soy sauce': 1.07, 'light soy sauce': 1.07, 'dark soy sauce': 1.09,
  'fish sauce': 1.07, 'oyster sauce': 1.15, 'hoisin sauce': 1.15,
  'ketchup': 1.07, 'mayonnaise': 1.00, 'mayo': 1.00,

  // Dense dairy
  'cream cheese': 1.02, 'sour cream': 1.04, 'yogurt': 1.04,
  'greek yogurt': 1.04, 'cottage cheese': 1.04, 'ricotta': 1.04,
};

/**
 * Get the density (g/ml) for a food item used in volume-to-weight conversion.
 * Tries exact match first, then category keyword fallbacks.
 */
export function getVolumeDensity(food: string): number {
  if (VOLUME_DENSITY_G_PER_ML[food] !== undefined) {
    return VOLUME_DENSITY_G_PER_ML[food];
  }
  // Category fallbacks by keyword
  if (food.includes('flour')) return 0.53;
  if (food.includes('starch')) return 0.52;
  if (food.includes('powder') && !food.includes('baking')) return 0.40;
  if (food.includes('oil')) return 0.92;
  if (food.includes('syrup')) return 1.30;
  if (food.includes('honey')) return 1.42;
  if (food.includes('butter') && !food.includes('peanut') && !food.includes('almond')) return 0.91;
  if (food.includes('oat')) return 0.37;
  return 1.0; // water default
}

// ── Volume units (for density correction) ──
const VOLUME_UNITS = new Set([
  'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
  'cup', 'cups', 'c',
  'tbsp', 'tablespoon', 'tablespoons', 'tbs',
  'tsp', 'teaspoon', 'teaspoons',
  'fl oz', 'fluid ounce', 'fluid ounces',
  'pint', 'pints', 'pt',
  'quart', 'quarts', 'qt',
  'gallon', 'gallons', 'gal',
]);

// ── Unit conversions to grams ──
const UNIT_TO_GRAMS: Record<string, number> = {
  // Metric
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'ml': 1,        // approximate for water-like liquids
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,

  // Imperial
  'lb': 453.6,
  'lbs': 453.6,
  'pound': 453.6,
  'pounds': 453.6,
  'oz': 28.35,
  'ounce': 28.35,
  'ounces': 28.35,

  // Volume (approximate for general cooking)
  'cup': 240,
  'cups': 240,
  'c': 240,
  'tbsp': 15,
  'tablespoon': 15,
  'tablespoons': 15,
  'tbs': 15,
  'tsp': 5,
  'teaspoon': 5,
  'teaspoons': 5,
  'fl oz': 30,
  'fluid ounce': 30,
  'fluid ounces': 30,
  'pint': 480,
  'pints': 480,
  'pt': 480,
  'quart': 960,
  'quarts': 960,
  'qt': 960,
  'gallon': 3840,
  'gallons': 3840,
  'gal': 3840,

  // Informal
  'pinch': 0.5,
  'dash': 0.6,
  'handful': 30,
  'bunch': 50,
  'sprig': 2,
  'sprigs': 2,
  'clove': 5,
  'cloves': 5,
  'slice': 30,
  'slices': 30,
  'piece': 30,
  'pieces': 30,
  'stalk': 40,
  'stalks': 40,
  'stick': 113,   // stick of butter
  'can': 400,
  'head': 400,
  'strip': 10,
  'strips': 10,
  'link': 75,
  'links': 75,
  'fillet': 170,
  'fillets': 170,
  'breast': 170,
  'breasts': 170,
  'thigh': 110,
  'thighs': 110,
  'drumstick': 100,
  'drumsticks': 100,
  'wing': 60,
  'wings': 60,
  'leaf': 1,
  'leaves': 1,
  'sheet': 15,
  'sheets': 15,
  'wrapper': 8,
  'wrappers': 8,
  'package': 400,
  'pkg': 400,
  'block': 400,
  'knob': 10,
  'cube': 10,
  'drop': 0.05,
  'drops': 0.05,
  'packet': 7,
  'envelope': 7,
};

// Common item weights when no unit given (each/whole item in grams)
const WHOLE_ITEM_GRAMS: Record<string, number> = {
  'egg': 50,
  'eggs': 50,
  'banana': 120,
  'apple': 180,
  'orange': 140,
  'lemon': 60,
  'lime': 45,
  'avocado': 150,
  'onion': 150,
  'yellow onion': 150,
  'red onion': 110,
  'white onion': 150,
  'tomato': 150,
  'potato': 170,
  'sweet potato': 130,
  'carrot': 70,
  'bell pepper': 120,
  'red bell pepper': 120,
  'green bell pepper': 120,
  'jalapeno': 15,
  'serrano pepper': 7,
  'thai chili': 5,
  'habanero': 8,
  'garlic': 5,         // per clove
  'shallot': 30,
  'green onion': 15,
  'scallion': 15,
  'celery': 40,        // per stalk
  'zucchini': 200,
  'cucumber': 300,
  'eggplant': 400,
  'peach': 150,
  'pear': 180,
  'mango': 200,
  'kiwi': 75,
  'fig': 50,
  'plum': 65,
  'tortilla': 45,
  'corn tortilla': 25,
  'flour tortilla': 45,
  'sausage': 75,
  'chicken breast': 170,
  'chicken thigh': 110,
  'pork chop': 170,
};

// Unicode fraction map
const FRACTION_MAP: Record<string, number> = {
  '\u00BC': 0.25,   // 1/4
  '\u00BD': 0.5,    // 1/2
  '\u00BE': 0.75,   // 3/4
  '\u2153': 0.333,  // 1/3
  '\u2154': 0.667,  // 2/3
  '\u215B': 0.125,  // 1/8
  '\u215C': 0.375,  // 3/8
  '\u215D': 0.625,  // 5/8
  '\u215E': 0.875,  // 7/8
};

interface ParsedIngredient {
  quantity: number;
  unit: string;
  food: string;
}

/**
 * Parse a quantity string like "1", "1/2", "1 1/2", "1.5"
 */
function parseQuantity(str: string): number {
  str = str.trim();
  if (!str) return 1;

  // Replace unicode fractions
  for (const [char, val] of Object.entries(FRACTION_MAP)) {
    if (str.includes(char)) {
      const before = str.replace(char, '').trim();
      return (before ? parseFloat(before) : 0) + val;
    }
  }

  // Handle "1/2" style fractions
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
    }
  }

  const val = parseFloat(str);
  return isNaN(val) ? 1 : val;
}

/**
 * Parse an ingredient line like "1 lb chicken thigh" into quantity, unit, food
 */
function parseIngredientLine(line: string): ParsedIngredient | null {
  line = line.trim();
  if (!line) return null;

  // Remove parenthetical notes like "(about 2 cups)", "(diced)", "(optional)"
  line = line.replace(/\(.*?\)/g, '').trim();

  // Remove leading bullet/dash
  line = line.replace(/^[-•*]\s*/, '');

  // Try to match: [quantity] [unit] [food]
  // Pattern: optional number (with fractions), optional unit, then the rest is food
  const match = line.match(
    /^([\d\s./½¼¾⅓⅔⅛⅜⅝⅞]+)?\s*([a-zA-Z]+\.?)?\s+(.+)$/
  );

  if (!match) {
    // No match — treat entire line as food with quantity 1
    return { quantity: 1, unit: '', food: line.toLowerCase() };
  }

  let [, qtyStr, unitCandidate, foodStr] = match;
  let quantity = qtyStr ? parseQuantity(qtyStr) : 1;
  let unit = (unitCandidate || '').replace(/\.$/, '').toLowerCase();
  let food = (foodStr || '').toLowerCase().trim();

  // Check if the "unit" is actually part of the food name
  if (unit && !UNIT_TO_GRAMS[unit]) {
    // Not a recognized unit — merge back with food
    food = unit + ' ' + food;
    unit = '';
  }

  // Clean up food name: remove adjectives like "fresh", "chopped", "minced", etc.
  food = food
    .replace(/,.*$/, '')               // remove everything after comma
    .replace(/\b(fresh|frozen|chopped|diced|minced|sliced|grated|shredded|peeled|cubed|crushed|ground|dried|canned|cooked|raw|boneless|skinless|skin-on|bone-in|trimmed|deveined|thawed|melted|softened|room temperature|cold|warm|hot|large|medium|small|extra|fine|finely|roughly|thinly|thick|thin|about|approximately|packed|loosely|firmly|heaping|rounded|level|to taste|for garnish|for serving|for frying|for deep frying|plus more|as needed|divided|optional|or more|or less)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { quantity, unit, food };
}

/**
 * Fuzzy match a food string against the database
 */
function findBestMatch(food: string): { key: string; nutrition: NutritionPer100g } | null {
  food = food.toLowerCase().trim();
  if (!food) return null;

  // Exact match
  if (NUTRITION_DB[food]) {
    return { key: food, nutrition: NUTRITION_DB[food] };
  }

  // Try removing trailing 's' for singular
  if (food.endsWith('s') && NUTRITION_DB[food.slice(0, -1)]) {
    return { key: food.slice(0, -1), nutrition: NUTRITION_DB[food.slice(0, -1)] };
  }

  // Try adding trailing 's' for plural
  if (NUTRITION_DB[food + 's']) {
    return { key: food + 's', nutrition: NUTRITION_DB[food + 's'] };
  }

  // Check if any DB key is contained in the food string (longer keys first for specificity)
  const sortedKeys = Object.keys(NUTRITION_DB).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (food.includes(key)) {
      return { key, nutrition: NUTRITION_DB[key] };
    }
  }

  // Check if food string is contained in any DB key
  for (const key of sortedKeys) {
    if (key.includes(food)) {
      return { key, nutrition: NUTRITION_DB[key] };
    }
  }

  // Word-overlap scoring
  const foodWords = food.split(/\s+/).filter(w => w.length > 2);
  let bestKey = '';
  let bestScore = 0;
  for (const key of Object.keys(NUTRITION_DB)) {
    const keyWords = key.split(/\s+/);
    let score = 0;
    for (const fw of foodWords) {
      for (const kw of keyWords) {
        if (fw === kw) score += 3;
        else if (kw.startsWith(fw) || fw.startsWith(kw)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  if (bestScore >= 2 && bestKey) {
    return { key: bestKey, nutrition: NUTRITION_DB[bestKey] };
  }

  return null;
}

/**
 * Convert a parsed ingredient to grams
 */
function toGrams(parsed: ParsedIngredient): number {
  const { quantity, unit, food } = parsed;

  if (unit && UNIT_TO_GRAMS[unit]) {
    const baseGrams = quantity * UNIT_TO_GRAMS[unit];
    if (VOLUME_UNITS.has(unit)) {
      return baseGrams * getVolumeDensity(food);
    }
    return baseGrams;
  }

  // No unit — look up whole item weight
  if (WHOLE_ITEM_GRAMS[food]) {
    return quantity * WHOLE_ITEM_GRAMS[food];
  }

  // Try matching partial food name to whole item weights
  for (const [key, weight] of Object.entries(WHOLE_ITEM_GRAMS)) {
    if (food.includes(key) || key.includes(food)) {
      return quantity * weight;
    }
  }

  // Default: assume 100g per unit if nothing matches
  return quantity * 100;
}

export interface NutritionResult {
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  fiber: string;
  matched: number;
  total: number;
}

/**
 * Calculate nutrition for a recipe given ingredients text and servings.
 * Ingredients should be newline-separated.
 * Returns per-serving nutrition with formatted strings.
 */
export function calculateNutrition(ingredientLines: string[], servings: number): NutritionResult {
  const effectiveServings = servings > 0 ? servings : 1;

  let totalCalories = 0;
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let matched = 0;
  let total = 0;

  for (const line of ingredientLines) {
    if (!line.trim()) continue;
    total++;

    const parsed = parseIngredientLine(line);
    if (!parsed) continue;

    const match = findBestMatch(parsed.food);
    if (!match) continue;

    matched++;
    const grams = toGrams(parsed);
    const ratio = grams / 100; // nutrition DB is per 100g

    totalCalories += match.nutrition.calories * ratio;
    totalCarbs += match.nutrition.carbs * ratio;
    totalProtein += match.nutrition.protein * ratio;
    totalFat += match.nutrition.fat * ratio;
    totalFiber += match.nutrition.fiber * ratio;
  }

  const perServing = (val: number) => Math.round(val / effectiveServings);

  return {
    calories: `~${perServing(totalCalories)} kcal`,
    carbs: `${perServing(totalCarbs)}g`,
    protein: `${perServing(totalProtein)}g`,
    fat: `${perServing(totalFat)}g`,
    fiber: `${perServing(totalFiber)}g`,
    matched,
    total,
  };
}
