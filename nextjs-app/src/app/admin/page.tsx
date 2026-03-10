'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import { Recipe, CATEGORIES } from '@/lib/types';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import RecipeCard from '@/components/RecipeCard';
import homeStyles from '../page.module.css';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { recipes, loading: recipesLoading, error } = useRecipes();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  // Fetch like & comment counts in batch (much faster than one-by-one)
  useEffect(() => {
    if (!user || recipes.length === 0) return;

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
  }, [user, recipes]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (currentFilter === 'favorites') {
      filtered = filtered.filter((r) => favorites.has(r.id));
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter((r) => r.category === currentFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, currentFilter, searchQuery, favorites]);

  const groupedByCategory = useMemo(() => {
    if (currentFilter !== 'all' || searchQuery.trim()) return null;
    const groups: { category: string; recipes: Recipe[] }[] = [];
    for (const cat of CATEGORIES) {
      const catRecipes = filteredRecipes.filter((r) => r.category === cat);
      if (catRecipes.length > 0) {
        groups.push({ category: cat, recipes: catRecipes });
      }
    }
    const knownCats = new Set(CATEGORIES as readonly string[]);
    const otherRecipes = filteredRecipes.filter((r) => !knownCats.has(r.category));
    if (otherRecipes.length > 0) {
      groups.push({ category: 'Other', recipes: otherRecipes });
    }
    return groups;
  }, [filteredRecipes, currentFilter, searchQuery]);

  const handleLogoClick = () => {
    setCurrentFilter('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecipeClick = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${recipe.name}"?`)) return;
    await supabase.from('recipes').delete().eq('id', recipe.id);
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const sectionTitle =
    currentFilter === 'all'
      ? 'All Recipes'
      : currentFilter === 'favorites'
        ? 'My Favorites'
        : currentFilter;

  if (authLoading || !user) {
    return (
      <div className={styles.page}>
        <p style={{ textAlign: 'center', padding: '4rem' }}>Loading...</p>
      </div>
    );
  }

  const totalViews = recipes.reduce((sum, r) => sum + (r.view_count || 0), 0);
  const totalLikes = Object.values(likeCounts).reduce((sum, c) => sum + c, 0);
  const totalComments = Object.values(commentCounts).reduce((sum, c) => sum + c, 0);

  const renderRecipeCard = (recipe: Recipe) => (
    <div key={recipe.id} className={styles.adminCardWrapper}>
      <RecipeCard
        recipe={recipe}
        isFavorite={isFavorite(recipe.id)}
        onToggleFavorite={toggleFavorite}
        onClick={handleRecipeClick}
      />
      <div className={styles.adminOverlay}>
        <div className={styles.adminStats}>
          <span title="Views">&#128065; {recipe.view_count || 0}</span>
          <span title="Likes">&#10084; {likeCounts[recipe.id] || 0}</span>
          <span title="Comments">&#128172; {commentCounts[recipe.id] || 0}</span>
        </div>
        <div className={styles.adminActions}>
          <Link
            href={`/admin/recipes/${recipe.id}/edit`}
            className={styles.editBtn}
            onClick={(e) => e.stopPropagation()}
          >
            &#9998; Edit
          </Link>
          <button
            className={styles.deleteBtn}
            onClick={(e) => handleDelete(e, recipe)}
          >
            &#128465; Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogoClick={handleLogoClick}
      />

      {/* Admin toolbar */}
      <div className={styles.adminBar}>
        <div className={styles.adminBarInner}>
          <div className={styles.adminBarLeft}>
            <span className={styles.adminBadge}>Pearl Mode</span>
            <div className={styles.statsRow}>
              <span>{recipes.length} recipes</span>
              <span>&#128065; {totalViews} views</span>
              <span>&#10084; {totalLikes} likes</span>
              <span>&#128172; {totalComments} comments</span>
            </div>
          </div>
          <div className={styles.adminBarRight}>
            <Link href="/admin/recipes/new" className="btn btn-primary">
              &#43; Add Recipe
            </Link>
            <button className="btn" onClick={handleSignOut}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <Hero />

      <div className={homeStyles.recipesSection}>
        {recipesLoading ? (
          <div className={homeStyles.emptyState}>
            <div className={homeStyles.emptyIcon}>&#9203;</div>
            <p>Loading recipes...</p>
          </div>
        ) : error ? (
          <div className={homeStyles.emptyState}>
            <div className={homeStyles.emptyIcon}>&#9888;</div>
            <p>Could not load recipes. Please try again later.</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className={homeStyles.emptyState}>
            <div className={homeStyles.emptyIcon}>&#127859;</div>
            <p>No recipes found.</p>
          </div>
        ) : groupedByCategory ? (
          groupedByCategory.map((group) => (
            <div key={group.category} className={homeStyles.categorySection}>
              <div className={homeStyles.sectionHeader}>
                <h2 className={homeStyles.sectionTitle}>{group.category}</h2>
                <span className={homeStyles.recipeCount}>
                  {group.recipes.length} {group.recipes.length === 1 ? 'recipe' : 'recipes'}
                </span>
              </div>
              <div className={homeStyles.recipeGrid}>
                {group.recipes.map(renderRecipeCard)}
              </div>
            </div>
          ))
        ) : (
          <>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>{sectionTitle}</h2>
            </div>
            <div className={homeStyles.recipeGrid}>
              {filteredRecipes.map(renderRecipeCard)}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
