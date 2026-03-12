'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getBrowserFingerprint } from '@/lib/fingerprint';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load all liked recipe IDs for this browser from Supabase
  useEffect(() => {
    const fetchFavorites = async () => {
      const fingerprint = getBrowserFingerprint();
      const { data } = await supabase
        .from('recipe_likes')
        .select('recipe_id')
        .eq('browser_fingerprint', fingerprint);

      if (data) {
        setFavorites(new Set(data.map((row: any) => row.recipe_id)));
      }
    };

    fetchFavorites();
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const fingerprint = getBrowserFingerprint();
    const wasLiked = favorites.has(id);

    // Optimistically update UI
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Sync with Supabase
    if (wasLiked) {
      await supabase
        .from('recipe_likes')
        .delete()
        .eq('recipe_id', id)
        .eq('browser_fingerprint', fingerprint);
    } else {
      await supabase.from('recipe_likes').insert({
        recipe_id: id,
        browser_fingerprint: fingerprint,
      });
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
