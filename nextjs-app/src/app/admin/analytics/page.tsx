'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';
import styles from './analytics.module.css';

type Period = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '3 Months',
  '6m': '6 Months',
  '1y': '1 Year',
  'all': 'All Time',
};

function getPeriodStart(period: Period): string | null {
  if (period === 'all') return null;
  const now = new Date();
  switch (period) {
    case '7d': now.setDate(now.getDate() - 7); break;
    case '30d': now.setDate(now.getDate() - 30); break;
    case '90d': now.setDate(now.getDate() - 90); break;
    case '6m': now.setMonth(now.getMonth() - 6); break;
    case '1y': now.setFullYear(now.getFullYear() - 1); break;
  }
  return now.toISOString();
}

interface DayData {
  date: string;
  likes: number;
  comments: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allLikes, setAllLikes] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      setRecipes(recipesData || []);

      const { data: likesData } = await supabase
        .from('recipe_likes')
        .select('recipe_id, created_at');
      setAllLikes(likesData || []);

      const { data: commentsData } = await supabase
        .from('recipe_comments')
        .select('recipe_id, created_at');
      setAllComments(commentsData || []);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const periodStart = getPeriodStart(period);

  const filteredLikes = useMemo(() => {
    if (!periodStart) return allLikes;
    return allLikes.filter((l) => l.created_at >= periodStart);
  }, [allLikes, periodStart]);

  const filteredComments = useMemo(() => {
    if (!periodStart) return allComments;
    return allComments.filter((c) => c.created_at >= periodStart);
  }, [allComments, periodStart]);

  const totalViews = recipes.reduce((sum, r) => sum + (r.view_count || 0), 0);
  const totalLikes = filteredLikes.length;
  const totalComments = filteredComments.length;

  // Build daily chart data
  const chartData = useMemo((): DayData[] => {
    const days: Record<string, DayData> = {};

    // Determine range
    const end = new Date();
    const start = periodStart ? new Date(periodStart) : (
      allLikes.length > 0 || allComments.length > 0
        ? new Date(Math.min(
            ...allLikes.map((l) => new Date(l.created_at).getTime()),
            ...allComments.map((c) => new Date(c.created_at).getTime()),
            end.getTime()
          ))
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    );

    // Fill in all days
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      days[key] = { date: key, likes: 0, comments: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }

    filteredLikes.forEach((l) => {
      const key = l.created_at.slice(0, 10);
      if (days[key]) days[key].likes++;
    });

    filteredComments.forEach((c) => {
      const key = c.created_at.slice(0, 10);
      if (days[key]) days[key].comments++;
    });

    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredLikes, filteredComments, periodStart, allLikes, allComments]);

  // Top recipes by views
  const topRecipes = useMemo(() => {
    return [...recipes]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5);
  }, [recipes]);

  // Per-recipe likes for top liked
  const recipeLikeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLikes.forEach((l) => {
      counts[l.recipe_id] = (counts[l.recipe_id] || 0) + 1;
    });
    return counts;
  }, [filteredLikes]);

  const topLiked = useMemo(() => {
    return [...recipes]
      .map((r) => ({ ...r, likes: recipeLikeCounts[r.id] || 0 }))
      .sort((a, b) => b.likes - a.likes)
      .filter((r) => r.likes > 0)
      .slice(0, 5);
  }, [recipes, recipeLikeCounts]);

  // Chart rendering
  const maxChart = Math.max(...chartData.map((d) => d.likes + d.comments), 1);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || !user || loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            A Pinch of <span>Pearl</span>
          </Link>
          <div className={styles.headerRight}>
            <span className={styles.adminBadge}>Pearl Mode</span>
            <Link href="/" className="btn">
              &larr; Back to Site
            </Link>
            <button className="btn" onClick={handleSignOut}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h1>&#128202; Dashboard</h1>
          <div className={styles.periodTabs}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period === p ? styles.periodActive : ''}`}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>&#128065;</span>
            <span className={styles.statNumber}>{totalViews}</span>
            <span className={styles.statLabel}>Total Views</span>
            <span className={styles.statNote}>all time</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>&#10084;</span>
            <span className={styles.statNumber}>{totalLikes}</span>
            <span className={styles.statLabel}>Likes</span>
            <span className={styles.statNote}>{period === 'all' ? 'all time' : `last ${PERIOD_LABELS[period].toLowerCase()}`}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>&#128172;</span>
            <span className={styles.statNumber}>{totalComments}</span>
            <span className={styles.statLabel}>Comments</span>
            <span className={styles.statNote}>{period === 'all' ? 'all time' : `last ${PERIOD_LABELS[period].toLowerCase()}`}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>&#127858;</span>
            <span className={styles.statNumber}>{recipes.length}</span>
            <span className={styles.statLabel}>Recipes</span>
            <span className={styles.statNote}>total</span>
          </div>
        </div>

        {/* Chart */}
        <div className={styles.chartSection}>
          <h2>Activity Over Time</h2>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}><span className={styles.legendDotLikes}></span> Likes</span>
            <span className={styles.legendItem}><span className={styles.legendDotComments}></span> Comments</span>
          </div>
          <div className={styles.chart}>
            {chartData.length > 0 ? (
              <div className={styles.chartBars}>
                {chartData.map((d, i) => {
                  const likesH = (d.likes / maxChart) * 100;
                  const commentsH = (d.comments / maxChart) * 100;
                  const showLabel = chartData.length <= 14 || i % Math.ceil(chartData.length / 14) === 0;
                  return (
                    <div key={d.date} className={styles.chartBarGroup} title={`${d.date}: ${d.likes} likes, ${d.comments} comments`}>
                      <div className={styles.chartBarStack}>
                        {d.likes > 0 && <div className={styles.chartBarLikes} style={{ height: `${likesH}%` }}></div>}
                        {d.comments > 0 && <div className={styles.chartBarComments} style={{ height: `${commentsH}%` }}></div>}
                      </div>
                      {showLabel && <span className={styles.chartLabel}>{d.date.slice(5)}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noData}>No activity data for this period.</p>
            )}
          </div>
        </div>

        {/* Top recipes */}
        <div className={styles.twoCol}>
          <div className={styles.rankSection}>
            <h2>&#128293; Most Viewed</h2>
            {topRecipes.length === 0 ? (
              <p className={styles.noData}>No views yet.</p>
            ) : (
              <ol className={styles.rankList}>
                {topRecipes.map((r, i) => (
                  <li key={r.id}>
                    <span className={styles.rankNum}>{i + 1}</span>
                    <Link href={`/recipe/${r.id}`} className={styles.rankName}>{r.name}</Link>
                    <span className={styles.rankStat}>&#128065; {r.view_count || 0}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className={styles.rankSection}>
            <h2>&#10084; Most Liked</h2>
            {topLiked.length === 0 ? (
              <p className={styles.noData}>No likes yet.</p>
            ) : (
              <ol className={styles.rankList}>
                {topLiked.map((r, i) => (
                  <li key={r.id}>
                    <span className={styles.rankNum}>{i + 1}</span>
                    <Link href={`/recipe/${r.id}`} className={styles.rankName}>{r.name}</Link>
                    <span className={styles.rankStat}>&#10084; {r.likes}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
