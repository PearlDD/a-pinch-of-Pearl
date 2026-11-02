'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ImportedRecipe } from '@/lib/recipeImport';
import styles from './RecipeImport.module.css';

export default function RecipeImport({ onApply }: { onApply: (recipe: ImportedRecipe, replace: boolean) => void }) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ recipe: ImportedRecipe; warnings: string[] } | null>(null);
  const [replace, setReplace] = useState(false);
  const [applied, setApplied] = useState(false);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');

  async function handleImport() {
    setLoading(true); setError(''); setResult(null); setApplied(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sign in again to import recipes.');
      const post = async (payload: Record<string, unknown>) => {
        const response = await fetch('/api/recipes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          signal: AbortSignal.timeout(65000),
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) throw Object.assign(new Error(body.error || 'Could not import this recipe.'), { code: body.code });
        return body;
      };
      setLoadingMessage('Loading the source and looking for a recipe…');
      let body = await post({ mode, value: mode === 'url' ? url : text, sourceUrl: url, includeVideo });
      if (body.next === 'video') {
        setLoadingMessage('Reading the video and its on-screen text…');
        const prepared = await post({ action: 'prepare-video', videoUrl: body.videoUrl, captionUrl: body.captionUrl });
        let transcript = prepared.transcript || '';
        const warnings: string[] = prepared.warnings || [];
        if (prepared.audioBase64) {
          setLoadingMessage('Transcribing the video speech…');
          try { transcript = (await post({ action: 'transcribe', audioBase64: prepared.audioBase64 })).transcript; }
          catch (err) {
            if (err && typeof err === 'object' && 'code' in err && ['AI_QUOTA_EXHAUSTED', 'AI_ACCESS_ERROR', 'AI_RATE_LIMITED', 'AI_NOT_CONFIGURED'].includes(String(err.code))) throw err;
            if (!prepared.images?.length) throw err;
            warnings.push('Speech could not be transcribed; this import uses sampled video frames only.');
          }
        }
        setLoadingMessage('Organizing ingredients and steps…');
        const value = `${body.text.slice(0, 10000)}\n\nVIDEO SPEECH / SUBTITLES:\n${transcript.slice(0, 28000)}`;
        body = await post({ action: 'extract', mode: 'text', value, sourceUrl: body.sourceUrl, images: prepared.images });
        body.warnings = [...body.warnings, ...warnings];
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error && err.name !== 'TimeoutError' && err.name !== 'SyntaxError' ? err.message : 'Import timed out or was unavailable. Try pasting the recipe text.');
    } finally { setLoading(false); }
  }

  return <section className={styles.panel} aria-labelledby="import-title">
    <h2 id="import-title">Import a recipe</h2>
    <p>Start with a recipe link, a copied post, an AI answer or a video transcript. Preview it, then add it to the form below.</p>
    <div className={styles.tabs}>
      <button type="button" aria-pressed={mode === 'url'} disabled={loading} onClick={() => { setMode('url'); setError(''); setResult(null); setApplied(false); }}>From a link</button>
      <button type="button" aria-pressed={mode === 'text'} disabled={loading} onClick={() => { setMode('text'); setError(''); setResult(null); setApplied(false); }}>Paste text / transcript</button>
    </div>
    <label htmlFor="import-url">{mode === 'url' ? 'Recipe or post link' : 'Original source link (optional)'}</label>
    <input id="import-url" type="url" value={url} maxLength={4000} disabled={loading} placeholder="https://…" onChange={e => { setUrl(e.target.value); setResult(null); setApplied(false); }} />
    {mode === 'text' && <>
      <label htmlFor="import-text">Recipe text or transcript</label>
      <textarea id="import-text" value={text} maxLength={40000} rows={8} disabled={loading} onChange={e => { setText(e.target.value); setResult(null); setApplied(false); }} placeholder={'Paste the full recipe here, including its title, ingredients and steps.\n\n支持中文食谱、AI 回答和视频字幕。'} />
    </>}
    {mode === 'url' && <label className={styles.replace}><input type="checkbox" checked={includeVideo} disabled={loading} onChange={e => { setIncludeVideo(e.target.checked); setResult(null); setApplied(false); }} />Read video speech and on-screen recipe text when available</label>}
    <p className={styles.hint}>Shared pages are loaded in a browser when needed. Video import supports accessible MP4/WebM clips up to 80 MB and five minutes, using subtitles or speech plus sampled frames. AI extraction sends the supplied text, audio and sampled images to the site’s selected AI service (Gemini or OpenAI) and uses its quota or API credits. If a source cannot be read, paste its text or transcript.</p>
    <button type="button" className="btn btn-primary" disabled={loading || !(mode === 'url' ? url : text).trim()} onClick={handleImport}>{loading ? 'Extracting recipe…' : 'Extract recipe'}</button>
    <div aria-live="polite">
      {loading && <p>{loadingMessage} Video imports may take a few minutes.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {error && mode === 'url' && <button type="button" className="btn" onClick={() => { setMode('text'); setError(''); }}>Paste text instead</button>}
      {result && <div className={styles.preview}>
        <h3>{result.recipe.name}</h3>
        <p>{result.recipe.ingredients.length} ingredients · {result.recipe.instructions.length} steps</p>
        <details><summary>Preview extracted recipe</summary>
          {result.recipe.description && <p>{result.recipe.description}</p>}
          <dl>{(['prep_time', 'cook_time', 'servings', 'calories', 'carbs', 'protein', 'fat', 'fiber'] as const).map(key => result.recipe[key] && <div key={key}><dt>{key.replace('_', ' ')}</dt><dd>{result.recipe[key]}</dd></div>)}</dl>
          <h4>Ingredients</h4><ul>{result.recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <h4>Steps</h4><ol>{result.recipe.instructions.map((item, i) => <li key={i}>{item}</li>)}</ol>
          {result.recipe.tips.length > 0 && <><h4>Tips</h4><ul>{result.recipe.tips.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
        </details>
        {result.warnings.map((warning, i) => <p key={i} className={styles.hint}>{warning}</p>)}
        <label className={styles.replace}><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />Replace fields I have already filled in</label>
        <button type="button" className="btn btn-primary" disabled={applied} onClick={() => { onApply(result.recipe, replace); setApplied(true); }}>Use in recipe form</button>
      </div>}
      {applied && <p>Recipe added to the form. Review it below and choose Save Recipe when ready.</p>}
    </div>
  </section>;
}
