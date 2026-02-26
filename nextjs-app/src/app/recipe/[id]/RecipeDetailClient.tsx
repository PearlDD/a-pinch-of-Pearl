'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Recipe } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import Footer from '@/components/Footer';
import styles from './RecipeDetail.module.css';

interface RecipeDetailClientProps {
  recipe: Recipe;
}

export default function RecipeDetailClient({
  recipe,
}: RecipeDetailClientProps) {
  // Track view count
  useEffect(() => {
    supabase
      .from('recipes')
      .update({ view_count: (recipe.view_count || 0) + 1 })
      .eq('id', recipe.id)
      .then();
  }, [recipe.id, recipe.view_count]);

  const ingredients = recipe.ingredients
    ? recipe.ingredients.split('\n').filter((l) => l.trim())
    : [];
  const instructions = recipe.instructions
    ? recipe.instructions.split('\n').filter((l) => l.trim())
    : [];
  const tips = recipe.tips
    ? recipe.tips.split('\n').filter((l) => l.trim())
    : [];
  const photos = recipe.photos
    ? recipe.photos.split('\n').filter((l) => l.trim())
    : [];

  return (
    <>
      {/* Simple header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          A Pinch of <span>Pearl</span>
        </Link>
      </header>

      <article className={styles.article}>
        {/* Hero image */}
        <div className={styles.heroImage}>
          {recipe.photo_url ? (
            <img
              src={recipe.photo_url}
              alt={recipe.name}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          <span className={styles.placeholderIcon}>&#127858;</span>
        </div>

        <div className={styles.content}>
          <Link href="/" className={styles.backLink}>
            &larr; Back to all recipes
          </Link>

          <span className={styles.category}>{recipe.category}</span>
          <h1>{recipe.name}</h1>
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}

          {/* Like button */}
          <div className={styles.likeRow}>
            <LikeButton recipeId={recipe.id} />
          </div>

          {/* Meta bar */}
          {recipe.servings && (
            <div className={styles.metaBar}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Servings</span>
                <span className={styles.metaValue}>{recipe.servings}</span>
              </div>
            </div>
          )}

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
          {instructions.length > 0 && (
            <section className={styles.section}>
              <h2>Instructions</h2>
              <ol className={styles.instructionsList}>
                {instructions.map((step, i) => (
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
          <CommentSection recipeId={recipe.id} />
        </div>
      </article>

      <Footer />
    </>
  );
}
