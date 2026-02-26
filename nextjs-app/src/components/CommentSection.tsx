'use client';

import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import styles from './CommentSection.module.css';

interface CommentSectionProps {
  recipeId: string;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
  const { comments, loading, submitting, addComment } = useComments(recipeId);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!text.trim()) {
      setError('Please write a comment.');
      return;
    }

    const success = await addComment(name, text);
    if (success) {
      setName('');
      setText('');
    } else {
      setError('Could not post comment. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.commentSection}>
      <h3>Comments {comments.length > 0 && `(${comments.length})`}</h3>

      {/* Comment form */}
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.nameInput}
          maxLength={50}
        />
        <textarea
          placeholder="Leave a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={styles.textInput}
          rows={3}
          maxLength={500}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments list */}
      {loading ? (
        <p className={styles.loadingText}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className={styles.noComments}>
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className={styles.commentsList}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <span className={styles.commentName}>
                  {comment.visitor_name}
                </span>
                <span className={styles.commentDate}>
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className={styles.commentText}>{comment.comment_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
