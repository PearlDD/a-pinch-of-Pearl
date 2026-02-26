'use client';

import { useLikes } from '@/hooks/useLikes';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  recipeId: string;
}

export default function LikeButton({ recipeId }: LikeButtonProps) {
  const { likeCount, isLiked, toggleLike, loading } = useLikes(recipeId);

  return (
    <button
      className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
      onClick={toggleLike}
      disabled={loading}
      title={isLiked ? 'Unlike this recipe' : 'Like this recipe'}
    >
      <span className={styles.heart}>{isLiked ? '\u2764\uFE0F' : '\u2661'}</span>
      <span className={styles.count}>{likeCount}</span>
      <span className={styles.label}>{likeCount === 1 ? 'Like' : 'Likes'}</span>
    </button>
  );
}
