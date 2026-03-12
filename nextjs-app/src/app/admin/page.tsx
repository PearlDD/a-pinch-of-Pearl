'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.push('/admin/login');
    } else {
      // Admin is logged in — redirect to home page (admin mode is shown there)
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-cream)' }}>
      <p>Redirecting...</p>
    </div>
  );
}
