'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from './login.module.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'pearl_login_lockout';

interface LockoutData {
  attempts: number;
  lockedUntil: number | null; // timestamp
}

function getLockoutData(): LockoutData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempts: 0, lockedUntil: null };
}

function saveLockoutData(data: LockoutData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearLockoutData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function AdminLogin() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check lockout status on mount and update countdown
  useEffect(() => {
    const checkLockout = () => {
      const data = getLockoutData();
      if (data.lockedUntil && Date.now() < data.lockedUntil) {
        setIsLocked(true);
        setRemainingTime(Math.ceil((data.lockedUntil - Date.now()) / 1000));
      } else if (data.lockedUntil && Date.now() >= data.lockedUntil) {
        // Lockout expired, reset attempts
        clearLockoutData();
        setIsLocked(false);
        setRemainingTime(0);
      } else {
        setIsLocked(false);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    const data = getLockoutData();
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      setError('Too many failed attempts. Please wait.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Successful login — clear any lockout data
      clearLockoutData();
      router.push('/admin');
    } catch (err: any) {
      const newAttempts = (data.attempts || 0) + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        saveLockoutData({ attempts: newAttempts, lockedUntil });
        setIsLocked(true);
        setRemainingTime(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setError(`Too many failed attempts. Locked for 15 minutes.`);
      } else {
        saveLockoutData({ attempts: newAttempts, lockedUntil: null });
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(
          `Incorrect email or password. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
        );
      }
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>
          &larr; Back to recipes
        </Link>
        <h1>&#128274; Pearl Mode</h1>
        <p>Sign in to manage your recipes.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              disabled={isLocked}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={isLocked}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {isLocked && remainingTime > 0 && (
            <p className={styles.lockout}>
              &#128338; Try again in {formatTime(remainingTime)}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || isLocked}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Signing in...' : isLocked ? 'Locked' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
