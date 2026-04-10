'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { uploadPhoto } from '@/lib/uploadPhoto';
import { CATEGORIES, Recipe, parseCategories, formatCategories } from '@/lib/types';
import ListInput from '@/components/ListInput';
import styles from '../../new/recipeForm.module.css';

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([CATEGORIES[0]]);
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [tipsList, setTipsList] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photos, setPhotos] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [additionalUploading, setAdditionalUploading] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setPhotoUrl(url);
    } catch (err: any) {
      setError('Failed to upload cover photo: ' + err.message);
    }
    setUploading(false);
  };

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAdditionalUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadPhoto(files[i]);
        urls.push(url);
      }
      setPhotos((prev) => (prev ? prev + '\n' + urls.join('\n') : urls.join('\n')));
    } catch (err: any) {
      setError('Failed to upload photos: ' + err.message);
    }
    setAdditionalUploading(false);
  };

  // Global paste listener — works anywhere on the page
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) return;
          if (!photoUrl) {
            setUploading(true);
            try {
              const url = await uploadPhoto(file);
              setPhotoUrl(url);
            } catch (err: any) {
              setError('Failed to upload pasted image: ' + err.message);
            }
            setUploading(false);
          } else {
            setAdditionalUploading(true);
            try {
              const url = await uploadPhoto(file);
              setPhotos((prev) => (prev ? prev + '\n' + url : url));
            } catch (err: any) {
              setError('Failed to upload pasted image: ' + err.message);
            }
            setAdditionalUploading(false);
          }
          return;
        }
      }
    };
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [photoUrl]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/admin/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !recipeId) return;

    const fetchRecipe = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (data) {
        setName(data.name || '');
        setSelectedCategories(data.category ? parseCategories(data.category) : [CATEGORIES[0]]);
        setDescription(data.description || '');
        setPrepTime(data.prep_time || '');
        setCookTime(data.cook_time || '');
        setServings(data.servings || '');
        setIngredientsList(data.ingredients ? data.ingredients.split('\n').filter((s: string) => s.trim()) : []);
        setInstructionsList(data.instructions ? data.instructions.split('\n').filter((s: string) => s.trim()).map((s: string) => s.replace(/^\d+\.\s*/, '')) : []);
        setTipsList(data.tips ? data.tips.split('\n').filter((s: string) => s.trim()) : []);
        setPhotoUrl(data.photo_url || '');
        setPhotos(data.photos || '');
        setSourceUrl(data.source_url || '');
      }
      setLoadingRecipe(false);
    };

    fetchRecipe();
  }, [user, recipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Recipe name is required.');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Select at least one category.');
      return;
    }

    setSaving(true);

    const { error: dbError } = await supabase
      .from('recipes')
      .update({
        name: name.trim(),
        category: formatCategories(selectedCategories),
        description: description.trim(),
        prep_time: prepTime.trim(),
        cook_time: cookTime.trim(),
        servings: servings.trim(),
        ingredients: ingredientsList.join('\n'),
        instructions: instructionsList.join('\n'),
        tips: tipsList.join('\n'),
        photo_url: photoUrl.trim(),
        photos: photos.trim(),
        source_url: sourceUrl.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push('/admin');
  };

  if (authLoading || !user || loadingRecipe) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          A Pinch of <span>Pearl</span>
        </Link>
      </header>

      <div className={styles.container}>
        <Link href="/admin" className={styles.backLink}>
          &larr; Back to dashboard
        </Link>

        <h1>Edit Recipe</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Recipe Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma's Chicken Soup"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Categories *</label>
            <div className={styles.checkboxGroup}>
              {CATEGORIES.map((cat) => (
                <label key={cat} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={(e) => {
                      setSelectedCategories((prev) =>
                        e.target.checked
                          ? [...prev, cat]
                          : prev.filter((c) => c !== cat)
                      );
                    }}
                  />
                  {cat}
                </label>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <span className={styles.hint} style={{ color: '#c0392b' }}>Select at least one category</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the recipe"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Prep Time</label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g. 15 min"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Cook Time</label>
              <input
                type="text"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="e.g. 30 min"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Servings</label>
            <input
              type="text"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="e.g. 4"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Ingredients</label>
            <ListInput
              items={ingredientsList}
              onChange={setIngredientsList}
              placeholder="e.g. 2 cups flour"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Instructions</label>
            <ListInput
              items={instructionsList}
              onChange={setInstructionsList}
              placeholder="e.g. Preheat oven to 350°F"
              numbered
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tips (optional)</label>
            <ListInput
              items={tipsList}
              onChange={setTipsList}
              placeholder="e.g. Use room temperature eggs"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Cover Photo (optional)</label>
            <div
              className={styles.pasteZone}
            >
              {photoUrl ? (
                <div className={styles.previewRow}>
                  <img src={photoUrl} alt="Cover preview" className={styles.previewImg} />
                  <button type="button" className={styles.removeBtn} onClick={() => setPhotoUrl('')}>Remove</button>
                </div>
              ) : uploading ? (
                <p className={styles.pasteHint}>Uploading...</p>
              ) : (
                <p className={styles.pasteHint}>Press Cmd+V anywhere on this page to paste an image</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleCoverUpload}
              className={styles.fileInput}
            />
            {uploading && <span className={styles.uploadStatus}>Uploading...</span>}
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Or paste image URL here"
              style={{ marginTop: '0.5rem' }}
            />
            <span className={styles.hint}>Paste an image (Cmd+V), choose a file, or enter a URL</span>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Photos (optional)</label>
            <div
              className={styles.pasteZone}
            >
              {photos ? (
                <div className={styles.previewGrid}>
                  {photos.split('\n').filter(u => u.trim()).map((url, i) => (
                    <div key={i} className={styles.previewRow}>
                      <img src={url} alt={`Photo ${i + 1}`} className={styles.previewImg} />
                      <button type="button" className={styles.removeBtn} onClick={() => {
                        setPhotos(photos.split('\n').filter((_, idx) => idx !== i).join('\n'));
                      }}>Remove</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.pasteHint}>Click here and press Cmd+V to paste an image</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={handleAdditionalUpload}
              className={styles.fileInput}
            />
            {additionalUploading && <span className={styles.uploadStatus}>Uploading...</span>}
            <span className={styles.hint}>Paste an image (Cmd+V), choose files, or enter URLs below</span>
            <textarea
              value={photos}
              onChange={(e) => setPhotos(e.target.value)}
              placeholder={"Or paste image URLs here, one per line"}
              rows={2}
              style={{ marginTop: '0.5rem' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Original Source URL (optional)</label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://originalrecipe.com/..."
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Recipe'}
            </button>
            <Link href="/admin" className="btn">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
