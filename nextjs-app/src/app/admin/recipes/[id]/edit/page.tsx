'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, Recipe } from '@/lib/types';
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
  const [category, setCategory] = useState(CATEGORIES[0]);
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
        setCategory(data.category || CATEGORIES[0]);
        setDescription(data.description || '');
        setPrepTime(data.prep_time || '');
        setCookTime(data.cook_time || '');
        setServings(data.servings || '');
        setIngredients(data.ingredients || '');
        setInstructions(data.instructions || '');
        setTips(data.tips || '');
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

    setSaving(true);

    const { error: dbError } = await supabase
      .from('recipes')
      .update({
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
              placeholder={"One ingredient per line"}
              rows={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"One step per line"}
              rows={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tips (optional)</label>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder={"One tip per line"}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Cover Photo URL (optional)</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            <span className={styles.hint}>Main hero image at the top</span>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Photo URLs (optional)</label>
            <textarea
              value={photos}
              onChange={(e) => setPhotos(e.target.value)}
              placeholder={"One URL per line"}
              rows={3}
            />
            <span className={styles.hint}>Photos gallery section</span>
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
