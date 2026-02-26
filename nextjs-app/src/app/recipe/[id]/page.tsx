import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import RecipeDetailClient from './RecipeDetailClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate Open Graph metadata for social sharing
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data: recipe } = await supabase
    .from('recipes')
    .select('name, description, photo_url, category')
    .eq('id', params.id)
    .single();

  if (!recipe) {
    return { title: 'Recipe Not Found — A Pinch of Pearl' };
  }

  const description =
    recipe.description || `A delicious ${recipe.category} recipe from A Pinch of Pearl`;

  return {
    title: `${recipe.name} — A Pinch of Pearl`,
    description,
    openGraph: {
      title: recipe.name,
      description,
      type: 'article',
      siteName: 'A Pinch of Pearl',
      ...(recipe.photo_url ? { images: [{ url: recipe.photo_url }] } : {}),
    },
    twitter: {
      card: recipe.photo_url ? 'summary_large_image' : 'summary',
      title: recipe.name,
      description,
      ...(recipe.photo_url ? { images: [recipe.photo_url] } : {}),
    },
  };
}

// Server component to fetch recipe data
export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!recipe) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          fontFamily: "'Playfair Display', serif",
        }}
      >
        <h1 style={{ color: 'var(--dark-brown)', fontSize: '2rem' }}>
          Recipe Not Found
        </h1>
        <p style={{ color: 'var(--text-medium)', marginTop: '1rem' }}>
          This recipe doesn&apos;t exist or has been removed.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            color: 'var(--accent-terracotta)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          &larr; Back to all recipes
        </a>
      </div>
    );
  }

  return <RecipeDetailClient recipe={recipe} />;
}
