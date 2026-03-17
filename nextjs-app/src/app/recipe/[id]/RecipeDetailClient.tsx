'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Recipe, CATEGORIES } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import Footer from '@/components/Footer';
import headerStyles from '@/components/Header.module.css';
import adminStyles from '@/app/admin/admin.module.css';
import styles from './RecipeDetail.module.css';

interface RecipeDetailClientProps {
  recipe: Recipe;
}

export default function RecipeDetailClient({
  recipe,
}: RecipeDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, loading: authLoading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdminDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${recipe.name}"?`)) return;
    await supabase.from('recipes').delete().eq('id', recipe.id);
    router.push('/admin');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Determine where to go back to
  const fromFilter = searchParams.get('from');
  const backHref = fromFilter && fromFilter !== 'all'
    ? `/?filter=${encodeURIComponent(fromFilter)}`
    : '/';

  // Track view count (skip for admin, wait for auth to finish loading)
  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) return;
    // Increment the counter
    supabase
      .from('recipes')
      .update({ view_count: (recipe.view_count || 0) + 1 })
      .eq('id', recipe.id)
      .then();
    // Log timestamped view for analytics
    supabase
      .from('recipe_views')
      .insert({ recipe_id: recipe.id })
      .then();
  }, [recipe.id, recipe.view_count, isAdmin, authLoading]);

  const ingredients = recipe.ingredients
    ? recipe.ingredients.split('\n').filter((l) => l.trim())
    : [];
  const instructions = recipe.instructions
    ? recipe.instructions.split('\n').filter((l) => l.trim())
    : [];
  // Strip leading numbers like "1. " or "2) " from instructions since <ol> adds its own
  const cleanInstructions = instructions.map((step) =>
    step.replace(/^\d+[\.\)\-]\s*/, '')
  );
  const tips = recipe.tips
    ? recipe.tips.split('\n').filter((l) => l.trim())
    : [];
  const photos = recipe.photos
    ? recipe.photos.split('\n').filter((l) => l.trim())
    : [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleFilterChange = (filter: string) => {
    if (filter === 'all') {
      router.push('/');
    } else {
      router.push(`/?filter=${encodeURIComponent(filter)}`);
    }
  };

  return (
    <>
      {/* Full header matching home page */}
      <header className={headerStyles.header}>
        <div className={headerStyles.headerInner}>
          <Link href="/" className={headerStyles.logo}>
            A Pinch of <span>Pearl</span>
          </Link>

          <div className={headerStyles.searchBar}>
            <span className={headerStyles.searchIcon}>&#128269;</span>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <nav className={headerStyles.nav}>
            <button onClick={() => handleFilterChange('all')}>All</button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={recipe.category === cat ? headerStyles.active : ''}
                onClick={() => handleFilterChange(cat)}
              >
                {cat}
              </button>
            ))}
            <button
              className={headerStyles.favBtn}
              onClick={() => handleFilterChange('favorites')}
            >
              &#10084; Favorites
            </button>
          </nav>
        </div>
      </header>

      {/* Admin toolbar */}
      {isAdmin && (
        <div className={adminStyles.adminBar}>
          <div className={adminStyles.adminBarInner}>
            <div className={adminStyles.adminBarLeft}>
              <span className={adminStyles.adminBadge}>Pearl Mode</span>
              <span className={adminStyles.statsRow}>
                <span>&#128065; {recipe.view_count || 0} views</span>
              </span>
            </div>
            <div className={adminStyles.adminBarRight}>
              <Link href={`/admin/recipes/${recipe.id}/edit`} className="btn btn-primary">
                &#9998; Edit
              </Link>
              <button className="btn" style={{ color: '#c0392b' }} onClick={handleAdminDelete}>
                &#128465; Delete
              </button>
              <button className="btn" onClick={handleSignOut}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <article className={styles.article}>
        {/* Hero image */}
        <div className={styles.heroImage}>
          {recipe.photo_url ? (
            <img
              src={recipe.photo_url}
              alt={recipe.name}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const placeholder = img.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'block';
              }}
            />
          ) : null}
          {!recipe.photo_url && <span className={styles.placeholderIcon}>&#127858;</span>}
        </div>

        <div className={styles.content}>
          <Link href={backHref} className={styles.backLink}>
            &larr; Back to recipes
          </Link>

          <Link href={`/?filter=${encodeURIComponent(recipe.category)}`} className={styles.category}>
            {recipe.category}
          </Link>
          <h1>{recipe.name}</h1>
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}

          {/* Like button */}
          <div className={`${styles.likeRow} no-print`}>
            <LikeButton recipeId={recipe.id} />
          </div>

          {/* Meta bar — always show servings */}
          <div className={styles.metaBar}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>SERVINGS</span>
              <span className={styles.metaValue}>{recipe.servings || '—'}</span>
            </div>
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <section className={styles.section}>
              <h2>Ingredients</h2>
              <ul className={styles.ingredientsList}>
                {ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Instructions */}
          {cleanInstructions.length > 0 && (
            <section className={styles.section}>
              <h2>Instructions</h2>
              <ol className={styles.instructionsList}>
                {cleanInstructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <section className={styles.section}>
              <h2>Tips</h2>
              <ul className={styles.ingredientsList}>
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Original Source */}
          <section className={styles.sourceSection}>
            <h2>&#128214; Original Recipe</h2>
            {recipe.source_url ? (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                &#128279; View Original Source
              </a>
            ) : (
              <p className={styles.sourceEmpty}>Original source not yet added.</p>
            )}
          </section>

          {/* Photos Gallery */}
          {photos.length > 0 && (
            <section className={styles.photosSection}>
              <h2>&#128247; Photos</h2>
              <div className={styles.photosGrid}>
                {photos.map((url, i) => (
                  <div key={i} className={styles.photoItem}>
                    <img
                      src={url}
                      alt={`${recipe.name} - photo ${i + 1}`}
                      onClick={() => window.open(url, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              &#128424; Print Recipe
            </button>
          </div>

          {/* Comments */}
          <div className="no-print">
            <CommentSection recipeId={recipe.id} />
          </div>
        </div>
      </article>

      <Footer />
    </>
  );
}
