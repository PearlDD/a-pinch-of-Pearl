'use client';

import { useState, type RefObject } from 'react';
import { calculateNutrition, resolveNutritionServings, type NutritionResult, type NutritionValues } from '@/lib/nutritionCalculator';
import type { ListInputHandle } from './ListInput';
import styles from './NutritionCalculator.module.css';

export default function NutritionCalculator({ ingredients, servings, editorRef, draftVersion, onCalculated }: {
  ingredients: string[]; servings: string; editorRef: RefObject<ListInputHandle>; draftVersion: number; onCalculated: (values: NutritionValues) => void;
}) {
  const [last, setLast] = useState<{ result: NutritionResult; snapshot: string; draft: number; servingsNote: string } | null>(null);
  const [estimateMissing, setEstimateMissing] = useState(true);
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ ingredients, servings, estimateMissing });
  const stale = !!last && (last.snapshot !== snapshot || last.draft !== draftVersion);

  const recalculate = () => {
    setError('');
    try {
      // Do not wait for setState or a blur event: calculate this exact visible
      // snapshot, including an edited row or a not-yet-added ingredient.
      const current = editorRef.current?.commit() ?? [...ingredients];
      const serving = resolveNutritionServings(servings, estimateMissing);
      const count = serving.count;
      const result = calculateNutrition(current, count, { estimateMissing });
      setLast({ result, snapshot: JSON.stringify({ ingredients: current, servings, estimateMissing }), draft: draftVersion, servingsNote: serving.note });
      // A failed attempt is diagnostic only: do not replace saved/manual inputs
      // with the calculator's empty incomplete-result fields.
      if (result.complete) onCalculated(result);
      else setError('Nutrition could not be calculated for the complete recipe. Existing nutrition values were kept and have not been updated by this calculation. Resolve the items below and recalculate.');
    } catch (err) {
      setLast(null);
      const reason = err instanceof Error ? err.message : 'Nutrition calculation failed. Please check the ingredient amounts.';
      setError(`${reason} Existing nutrition values were kept and have not been updated by this calculation.`);
    }
  };

  return <div className={styles.calculator}>
    <button type="button" className={styles.calculate}
      // Keep the ingredient textarea focused until click commits its draft.
      // Saving on blur can move this button between pointer-down and click.
      onPointerDown={event => event.preventDefault()}
      onClick={recalculate}>Auto-calculate Nutrition</button>
    <label className={styles.policy}>
      <input type="checkbox" checked={estimateMissing} onChange={event => setEstimateMissing(event.target.checked)} />{' '}
      Estimate unclear amounts using standard portions (review assumptions)
    </label>
    <div aria-live="polite">
      {stale ? <p className={styles.warning}>Ingredients or servings changed. Recalculate to update nutrition and matching.</p> : <>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {last && <>
          <p className={last.result.complete && !last.result.estimated ? styles.status : styles.warning}>
            {last.result.matched}/{last.result.total} foods identified ({Math.round(last.result.matched / last.result.total * 100)}%).{' '}
            {last.result.quantified}/{last.result.total} amounts resolved; {last.result.estimated} estimated.
          </p>
          <p className={styles.hint}>Food matching does not establish quantity accuracy. Values use approximate food references.{' '}{last.servingsNote}</p>
          {last.result.ignoredLines.length > 0 && <p className={styles.hint}>Headings/equipment excluded: {last.result.ignoredLines.join(', ')}</p>}
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
