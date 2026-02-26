'use client';

import { Recipe } from '@/lib/types';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (recipe: Recipe) => void;
}

export default function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  onClick,
}: RecipeCardProps) {
  return (
    <div className={styles.card} onClick={() => onClick(recipe)}>
      <div className={styles.cardImage}>
        {recipe.photo_url ? (
          <img
            src={recipe.photo_url}
            alt={recipe.name}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.querySelector(
                '.placeholder'
              )!.removeAttribute('style');
            }}
          />
        ) : null}
        <span
          className="placeholder"
          style={recipe.photo_url ? { display: 'none' } : {}}
        >
          &#127858;
        </span>
        <span className={styles.categoryBadge}>{recipe.category}</span>
        <button
          className={`${styles.favoriteBtn} ${isFavorite ? styles.favorited : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(recipe.id);
          }}
        >
          {isFavorite ? '\u2764\uFE0F' : '\u2661'}
        </button>
      </div>
      <div className={styles.cardContent}>
        <h3>{recipe.name}</h3>
        <p className={styles.recipeDesc}>
          {recipe.description || 'A delicious recipe...'}
        </p>
        <div className={styles.cardMeta}>
          {recipe.servings && (
            <span>&#127860; Serves {recipe.servings.replace(/\D*servings?\D*/gi, '').trim() || recipe.servings}</span>
          )}
        </div>
      </div>
    </div>
  );
}
