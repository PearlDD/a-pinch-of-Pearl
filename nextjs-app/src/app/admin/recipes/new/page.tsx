'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { uploadPhoto } from '@/lib/uploadPhoto';
import { CATEGORIES } from '@/lib/types';
import styles from './recipeForm.module.css';

export default function AddRecipePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tips, setTips] = useState('');
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

  useEffect(() => {
    if (!authLoading && !user) router.push('/admin/login');
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Recipe name is required.');
      return;
    }

    setSaving(true);

    const { error: dbError } = await supabase.from('recipes').insert({
      name: name.trim(),
      category,
      description: description.trim(),
      prep_time: prepTime.trim(),
      cook_time: cookTime.trim(),
      servings: servings.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      tips: tips.trim(),
      photo_url: photoUrl.trim(),
      photos: photos.trim(),
      source_url: sourceUrl.trim(),
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push('/admin');
  };

  if (authLoading || !user) {
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

        <h1>Add New Recipe</h1>

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
            <label>Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder={"One ingredient per line, e.g.:\n2 cups flour\n1 tsp salt\n3 eggs"}
              rows={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"One step per line, e.g.:\nPreheat oven to 350\u00B0F\nMix dry ingredients\nAdd wet ingredients and stir"}
              rows={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tips (optional)</label>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder={"One tip per line, e.g.:\nUse room temperature eggs\nDon't overmix the batter"}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Cover Photo (optional)</label>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleCoverUpload}
              className={styles.fileInput}
            />
            {uploading && <span className={styles.uploadStatus}>Uploading...</span>}
            {photoUrl && (
              <div className={styles.previewRow}>
                <img src={photoUrl} alt="Cover preview" className={styles.previewImg} />
                <button type="button" className={styles.removeBtn} onClick={() => setPhotoUrl('')}>Remove</button>
              </div>
            )}
            <span className={styles.hint}>This will be the main hero image at the top</span>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Photos (optional)</label>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={handleAdditionalUpload}
              className={styles.fileInput}
            />
            {additionalUploading && <span className={styles.uploadStatus}>Uploading...</span>}
            {photos && (
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
            )}
            <span className={styles.hint}>These will appear in the Photos gallery section</span>
          </div>

          <div className={styles.formGroup}>
            <label>Original Source URL (optional)</label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://originalrecipe.com/..."
            />
            <span className={styles.hint}>Link to where the recipe originally came from</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Recipe'}
            </button>
            <Link href="/admin" className="btn">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
