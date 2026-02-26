'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch recipes
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      const recipesList = recipesData || [];
      setRecipes(recipesList);

      // Fetch like counts per recipe
      const likes: Record<string, number> = {};
      for (const r of recipesList) {
        const { count } = await supabase
          .from('recipe_likes')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', r.id);
        likes[r.id] = count || 0;
      }
      setLikeCounts(likes);

      // Fetch comment counts per recipe
      const comments: Record<string, number> = {};
      for (const r of recipesList) {
        const { count } = await supabase
          .from('recipe_comments')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', r.id);
        comments[r.id] = count || 0;
      }
      setCommentCounts(comments);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleDelete = async (recipe: Recipe) => {
    if (!confirm(`Are you sure you want to delete "${recipe.name}"?`)) return;

    await supabase.from('recipes').delete().eq('id', recipe.id);
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className={styles.page}>
        <p>Loading...</p>
      </div>
    );
  }

  const totalViews = recipes.reduce((sum, r) => sum + (r.view_count || 0), 0);
  const totalLikes = Object.values(likeCounts).reduce((sum, c) => sum + c, 0);
  const totalComments = Object.values(commentCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            A Pinch of <span>Pearl</span>
          </Link>
          <div className={styles.headerRight}>
            <span className={styles.adminBadge}>Pearl Mode</span>
            <button className="btn" onClick={handleSignOut}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h1>Dashboard</h1>
          <Link href="/admin/recipes/new" className="btn btn-primary">
            &#43; Add Recipe
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{recipes.length}</span>
            <span className={styles.statLabel}>Recipes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalViews}</span>
            <span className={styles.statLabel}>Total Views</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalLikes}</span>
            <span className={styles.statLabel}>Total Likes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalComments}</span>
            <span className={styles.statLabel}>Total Comments</span>
          </div>
        </div>

        {/* Recipe list */}
        <h2 className={styles.sectionTitle}>All Recipes</h2>

        {loading ? (
          <p style={{ color: 'var(--text-light)' }}>Loading recipes...</p>
        ) : recipes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No recipes yet. Click &quot;+ Add Recipe&quot; to create your first one!</p>
          </div>
        ) : (
          <div className={styles.recipeTable}>
            {recipes.map((recipe) => (
              <div key={recipe.id} className={styles.recipeRow}>
                <div className={styles.recipeInfo}>
                  <h3>{recipe.name}</h3>
                  <span className={styles.recipeCat}>{recipe.category}</span>
                </div>
                <div className={styles.recipeStats}>
                  <span title="Views">&#128065; {recipe.view_count || 0}</span>
                  <span title="Likes">&#10084; {likeCounts[recipe.id] || 0}</span>
                  <span title="Comments">&#128172; {commentCounts[recipe.id] || 0}</span>
                </div>
                <div className={styles.recipeActions}>
                  <Link
                    href={`/recipe/${recipe.id}`}
                    className="btn"
                    target="_blank"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/recipes/${recipe.id}/edit`}
                    className="btn"
                  >
                    &#9998; Edit
                  </Link>
                  <button
                    className="btn"
                    style={{ color: '#c0392b' }}
                    onClick={() => handleDelete(recipe)}
                  >
                    &#128465; Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
