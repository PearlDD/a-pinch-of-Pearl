'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RecipeCard from '@/components/RecipeCard';
import Footer from '@/components/Footer';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { Recipe, CATEGORIES } from '@/lib/types';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { recipes, loading, error } = useRecipes();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Category / favorites filter
    if (currentFilter === 'favorites') {
      filtered = filtered.filter((r) => favorites.has(r.id));
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter((r) => r.category === currentFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, currentFilter, searchQuery, favorites]);

  // Group recipes by category for the "All" view
  const groupedByCategory = useMemo(() => {
    if (currentFilter !== 'all' || searchQuery.trim()) return null;
    const groups: { category: string; recipes: Recipe[] }[] = [];
    for (const cat of CATEGORIES) {
      const catRecipes = filteredRecipes.filter((r) => r.category === cat);
      if (catRecipes.length > 0) {
        groups.push({ category: cat, recipes: catRecipes });
      }
    }
    // Catch any recipes with categories not in CATEGORIES list
    const knownCats = new Set(CATEGORIES as readonly string[]);
    const otherRecipes = filteredRecipes.filter((r) => !knownCats.has(r.category));
    if (otherRecipes.length > 0) {
      groups.push({ category: 'Other', recipes: otherRecipes });
    }
    return groups;
  }, [filteredRecipes, currentFilter, searchQuery]);

  const sectionTitle =
    currentFilter === 'all'
      ? 'All Recipes'
      : currentFilter === 'favorites'
        ? 'My Favorites'
        : currentFilter;

  const handleLogoClick = () => {
    setCurrentFilter('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecipeClick = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  const getEmptyMessage = () => {
    if (currentFilter === 'favorites') {
      return 'No favorites yet! Click the heart on any recipe to save it.';
    }
    if (searchQuery) {
      return 'No recipes match your search. Try different keywords!';
    }
    return 'No recipes here yet. Check back soon!';
  };

  return (
    <>
      <Header
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogoClick={handleLogoClick}
      />

      <Hero />

      <div className={styles.recipesSection}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>&#9203;</div>
            <p>Loading recipes...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>&#9888;</div>
            <p>Could not load recipes. Please try again later.</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>&#127859;</div>
            <p>{getEmptyMessage()}</p>
          </div>
        ) : groupedByCategory ? (
          /* Grouped view for "All" */
          groupedByCategory.map((group) => (
            <div key={group.category} className={styles.categorySection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{group.category}</h2>
                <span className={styles.recipeCount}>{group.recipes.length} {group.recipes.length === 1 ? 'recipe' : 'recipes'}</span>
              </div>
              <div className={styles.recipeGrid}>
                {group.recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={isFavorite(recipe.id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={handleRecipeClick}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Flat view for filtered/search/favorites */
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
            </div>
            <div className={styles.recipeGrid}>
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorite={isFavorite(recipe.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={handleRecipeClick}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
