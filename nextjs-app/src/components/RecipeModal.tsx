'use client';

import { Recipe } from '@/lib/types';
import styles from './RecipeModal.module.css';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  if (!recipe) return null;

  const ingredients = recipe.ingredients
    ? recipe.ingredients.split('\n').filter((l) => l.trim())
    : [];
  const instructions = recipe.instructions
    ? recipe.instructions.split('\n').filter((l) => l.trim())
    : [];
  const tips = recipe.tips
    ? recipe.tips.split('\n').filter((l) => l.trim())
    : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
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
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <span className={styles.category}>{recipe.category}</span>
          <h2>{recipe.name}</h2>
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}

          <div className={styles.metaBar}>
            {recipe.prep_time && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Prep Time</span>
                <span className={styles.metaValue}>{recipe.prep_time}</span>
              </div>
            )}
            {recipe.cook_time && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Cook Time</span>
                <span className={styles.metaValue}>{recipe.cook_time}</span>
              </div>
            )}
            {recipe.servings && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Servings</span>
                <span className={styles.metaValue}>{recipe.servings}</span>
              </div>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className={styles.section}>
              <h3>Ingredients</h3>
              <ul className={styles.ingredientsList}>
                {ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {instructions.length > 0 && (
            <div className={styles.section}>
              <h3>Instructions</h3>
              <ol className={styles.instructionsList}>
                {instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {tips.length > 0 && (
            <div className={styles.section}>
              <h3>Tips</h3>
              <ul className={styles.ingredientsList}>
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {recipe.source_url && (
            <div className={styles.section}>
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                &#128279; View Original Recipe
              </a>
            </div>
          )}

          <div className={styles.actions}>
            <button className="btn btn-primary" onClick={() => window.print()}>
              &#128424; Print Recipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
