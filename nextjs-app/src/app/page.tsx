'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RecipeCard from '@/components/RecipeCard';
import Footer from '@/components/Footer';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Recipe, CATEGORIES, parseCategories } from '@/lib/types';
import adminStyles from '@/app/admin/admin.module.css';
import styles from './page.module.css';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { recipes, loading, error } = useRecipes();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { isAdmin, signOut } = useAuth();
  const initialFilter = searchParams.get('filter') || 'all';
  const [currentFilter, setCurrentFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // Fetch like & comment counts for admin overlay
  useEffect(() => {
    if (!isAdmin || recipes.length === 0) return;
    const fetchStats = async () => {
      const { data: likesData } = await supabase
        .from('recipe_likes')
        .select('recipe_id');
      const likes: Record<string, number> = {};
      (likesData || []).forEach((row: any) => {
        likes[row.recipe_id] = (likes[row.recipe_id] || 0) + 1;
      });
      setLikeCounts(likes);

      const { data: commentsData } = await supabase
        .from('recipe_comments')
        .select('recipe_id');
      const comments: Record<string, number> = {};
      (commentsData || []).forEach((row: any) => {
        comments[row.recipe_id] = (comments[row.recipe_id] || 0) + 1;
      });
      setCommentCounts(comments);
    };
    fetchStats();
  }, [isAdmin, recipes]);

  useEffect(() => {
    const urlFilter = searchParams.get('filter') || 'all';
    setCurrentFilter(urlFilter);
  }, [searchParams]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    } else {
      if (currentFilter === 'favorites') {
        filtered = filtered.filter((r) => favorites.has(r.id));
      } else if (currentFilter !== 'all') {
        filtered = filtered.filter((r) =>
          parseCategories(r.category).includes(currentFilter)
        );
      }
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, currentFilter, searchQuery, favorites]);

  const groupedByCategory = useMemo(() => {
    if (currentFilter !== 'all' || searchQuery.trim()) return null;
    const groups: { category: string; recipes: Recipe[] }[] = [];
    for (const cat of CATEGORIES) {
      const catRecipes = filteredRecipes.filter((r) =>
        parseCategories(r.category).includes(cat)
      );
      if (catRecipes.length > 0) {
        groups.push({ category: cat, recipes: catRecipes });
      }
    }
    const knownCats = new Set(CATEGORIES as readonly string[]);
    const otherRecipes = filteredRecipes.filter(
      (r) => !parseCategories(r.category).some((c) => knownCats.has(c))
    );
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
    const params = currentFilter !== 'all' ? `?from=${encodeURIComponent(currentFilter)}` : '';
    router.push(`/recipe/${recipe.id}${params}`);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDelete = async (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${recipe.name}"?`)) return;
    await supabase.from('recipes').delete().eq('id', recipe.id);
    window.location.reload();
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

  const renderRecipeCard = (recipe: Recipe) => {
    if (isAdmin) {
      return (
        <div key={recipe.id} className={adminStyles.adminCardWrapper}>
          <RecipeCard
            recipe={recipe}
            isFavorite={isFavorite(recipe.id)}
            onToggleFavorite={toggleFavorite}
            onClick={handleRecipeClick}
          />
          <div className={adminStyles.adminOverlay}>
            <div className={adminStyles.adminStats}>
              <span title="Views">&#128065; {recipe.view_count || 0}</span>
              <span title="Likes">&#10084; {likeCounts[recipe.id] || 0}</span>
              <span title="Comments">&#128172; {commentCounts[recipe.id] || 0}</span>
            </div>
            <div className={adminStyles.adminActions}>
              <Link
                href={`/admin/recipes/${recipe.id}/edit`}
                className={adminStyles.editBtn}
                onClick={(e) => e.stopPropagation()}
              >
                &#9998; Edit
              </Link>
              <button
                className={adminStyles.deleteBtn}
                onClick={(e) => handleDelete(e, recipe)}
              >
                &#128465; Delete
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <RecipeCard
        key={recipe.id}
        recipe={recipe}
        isFavorite={isFavorite(recipe.id)}
        onToggleFavorite={toggleFavorite}
        onClick={handleRecipeClick}
      />
    );
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

      {isAdmin && (
        <div className={adminStyles.adminBar}>
          <div className={adminStyles.adminBarInner}>
            <div className={adminStyles.adminBarLeft}>
              <span className={adminStyles.adminBadge}>Pearl Mode</span>
              <span className={adminStyles.statsRow}>
                <span>{recipes.length} recipes</span>
              </span>
            </div>
            <div className={adminStyles.adminBarRight}>
              <Link href="/admin/analytics" className="btn">
                &#128202; Dashboard
              </Link>
              <Link href="/admin/recipes/new" className="btn btn-primary">
                &#43; Add Recipe
              </Link>
              <button className="btn" onClick={handleSignOut}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
          groupedByCategory.map((group) => (
            <div key={group.category} className={styles.categorySection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{group.category}</h2>
                <span className={styles.recipeCount}>{group.recipes.length} {group.recipes.length === 1 ? 'recipe' : 'recipes'}</span>
              </div>
              <div className={styles.recipeGrid}>
                {group.recipes.map(renderRecipeCard)}
              </div>
            </div>
          ))
        ) : (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
            </div>
            <div className={styles.recipeGrid}>
              {filteredRecipes.map(renderRecipeCard)}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
