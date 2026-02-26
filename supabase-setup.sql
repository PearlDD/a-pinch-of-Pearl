-- ============================================
-- A Pinch of Pearl - Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  prep_time TEXT DEFAULT '',
  cook_time TEXT DEFAULT '',
  servings TEXT DEFAULT '',
  ingredients TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  photo_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comments table
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Likes table
CREATE TABLE recipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  browser_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, browser_fingerprint)
);

-- 4. Indexes for performance
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX idx_likes_recipe ON recipe_likes(recipe_id);

-- 5. Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can read recipes
CREATE POLICY "Anyone can read recipes"
  ON recipes FOR SELECT
  USING (true);

-- Everyone can read comments
CREATE POLICY "Anyone can read comments"
  ON recipe_comments FOR SELECT
  USING (true);

-- Everyone can add comments
CREATE POLICY "Anyone can add comments"
  ON recipe_comments FOR INSERT
  WITH CHECK (true);

-- Everyone can read likes
CREATE POLICY "Anyone can read likes"
  ON recipe_likes FOR SELECT
  USING (true);

-- Everyone can add likes
CREATE POLICY "Anyone can add likes"
  ON recipe_likes FOR INSERT
  WITH CHECK (true);

-- Everyone can remove their own likes
CREATE POLICY "Anyone can remove likes"
  ON recipe_likes FOR DELETE
  USING (true);

-- Admin can do everything with recipes (we'll add admin policies after auth setup)
-- For now, allow all operations so we can test
CREATE POLICY "Allow all recipe operations for now"
  ON recipes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow updating view counts
CREATE POLICY "Anyone can update view count"
  ON recipes FOR UPDATE
  USING (true)
  WITH CHECK (true);
