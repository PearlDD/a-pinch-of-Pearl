'use client';

import { useState, type RefObject } from 'react';
import { calculateNutrition, EMPTY_NUTRITION, parseRecipeServings, type NutritionResult, type NutritionValues } from '@/lib/nutritionCalculator';
import type { ListInputHandle } from './ListInput';
import styles from './NutritionCalculator.module.css';

export default function NutritionCalculator({ ingredients, servings, editorRef, draftVersion, onCalculated }: {
  ingredients: string[]; servings: string; editorRef: RefObject<ListInputHandle>; draftVersion: number; onCalculated: (values: NutritionValues) => void;
}) {
  const [last, setLast] = useState<{ result: NutritionResult; snapshot: string; draft: number } | null>(null);
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ ingredients, servings });
  const stale = !!last && (last.snapshot !== snapshot || last.draft !== draftVersion);

  const recalculate = () => {
    setError('');
    try {
      // Do not wait for setState or a blur event: calculate this exact visible
      // snapshot, including an edited row or a not-yet-added ingredient.
      const current = editorRef.current?.commit() ?? [...ingredients];
      const count = servings.trim() ? parseRecipeServings(servings) : 1;
      const result = calculateNutrition(current, count);
      setLast({ result, snapshot: JSON.stringify({ ingredients: current, servings }), draft: draftVersion });
      onCalculated(result);
      if (!result.complete) setError('Nutrition could not be calculated for the complete recipe. Resolve the items below and recalculate. Previous values have been cleared.');
    } catch (err) {
      setLast(null); onCalculated({ ...EMPTY_NUTRITION });
      setError(err instanceof Error ? err.message : 'Nutrition calculation failed. Please check the ingredient amounts.');
    }
  };

  return <div className={styles.calculator}>
    <button type="button" className={styles.calculate}
      // Keep the ingredient textarea focused until click commits its draft.
      // Saving on blur can move this button between pointer-down and click.
      onPointerDown={event => event.preventDefault()}
      onClick={recalculate}>Auto-calculate Nutrition</button>
    <div aria-live="polite">
      {stale ? <p className={styles.warning}>Ingredients or servings changed. Recalculate to update nutrition and matching.</p> : <>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {last && <>
          <p className={last.result.complete && !last.result.estimated ? styles.status : styles.warning}>
            {last.result.matched}/{last.result.total} foods identified ({Math.round(last.result.matched / last.result.total * 100)}%).{' '}
            {last.result.quantified}/{last.result.total} amounts resolved; {last.result.estimated} estimated.
          </p>
          <p className={styles.hint}>Food matching does not establish quantity accuracy. Values use approximate food references.{!servings.trim() && ' Servings are blank: showing whole-recipe totals. Enter servings for per-serving values.'}</p>
          <details open={!last.result.complete}>
            <summary>Review ingredient amounts and assumptions</summary>
            <ul className={styles.review}>
              {last.result.ingredients.map((item, index) => <li key={index}>
                <strong>{item.line}</strong>
                <div>{item.food ? `Reference: ${item.food}` : 'No matching food reference'}{item.grams !== null && ` · ${Math.round(item.grams * 100) / 100} g${item.estimated ? ' (estimated)' : ''}`}</div>
                {item.issues.map((issue, i) => <div key={`issue-${i}`} className={styles.error}>{issue}</div>)}
                {item.notes.map((note, i) => <div key={`note-${i}`} className={styles.hint}>{note}</div>)}
              </li>)}
            </ul>
          </details>
        </>}
      </>}
    </div>
  </div>;
}
