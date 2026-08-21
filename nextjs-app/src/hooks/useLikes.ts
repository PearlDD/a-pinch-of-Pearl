'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getBrowserFingerprint } from '@/lib/fingerprint';

export function useLikes(recipeId: string) {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLikes = useCallback(async () => {
    // Get total like count
    const { count } = await supabase
      .from('recipe_likes')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    setLikeCount(count || 0);

    // Check if current user has liked
    const fingerprint = getBrowserFingerprint();
    const { data } = await supabase
      .from('recipe_likes')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('browser_fingerprint', fingerprint);

    setIsLiked((data || []).length > 0);
  }, [recipeId]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const fingerprint = getBrowserFingerprint();

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('recipe_likes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('browser_fingerprint', fingerprint);

      if (error) {
        console.error('[useLikes] Failed to unlike:', { recipeId, error: error.message });
      }

      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      // Like
      const { error } = await supabase.from('recipe_likes').insert({
        recipe_id: recipeId,
        browser_fingerprint: fingerprint,
      });

      if (error) {
        console.error('[useLikes] Failed to like:', { recipeId, error: error.message });
      }

      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }

    setLoading(false);
  }, [recipeId, isLiked, loading]);

  return { likeCount, isLiked, toggleLike, loading };
}
