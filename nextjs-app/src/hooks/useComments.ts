'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RecipeComment } from '@/lib/types';

export function useComments(recipeId: string) {
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('recipe_comments')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    setComments(data || []);
    setLoading(false);
  }, [recipeId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (visitorName: string, commentText: string) => {
      if (submitting) return false;
      setSubmitting(true);

      const { error } = await supabase.from('recipe_comments').insert({
        recipe_id: recipeId,
        visitor_name: visitorName.trim(),
        comment_text: commentText.trim(),
      });

      if (!error) {
        await fetchComments();
        setSubmitting(false);
        return true;
      }

      setSubmitting(false);
      return false;
    },
    [recipeId, submitting, fetchComments]
  );

  return { comments, loading, submitting, addComment };
}
