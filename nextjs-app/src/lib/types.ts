export interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  ingredients: string;
  instructions: string;
  tips: string;
  photo_url: string;
  photos: string;
  source_url: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  visitor_name: string;
  comment_text: string;
  created_at: string;
}

export interface RecipeLike {
  id: string;
  recipe_id: string;
  browser_fingerprint: string;
  created_at: string;
}

export const CATEGORIES = [
  'Main Dish',
  'Flour-Based Food',
  'Dessert',
  'Beverage',
  'Epic Recipes',
] as const;

export type Category = (typeof CATEGORIES)[number];
