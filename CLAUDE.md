# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**A Pinch of Pearl** — a recipe blog built with Next.js 14 (App Router) and Supabase. Features public recipe browsing with search/filtering, browser-fingerprint-based likes/favorites, comments, and an admin interface for recipe management.

## Commands

All commands run from `nextjs-app/`:

```bash
npm run dev      # Local dev server
npm run build    # Production build
npm run lint     # ESLint (next lint)
npm start        # Production server
```

No test framework is configured.

## Architecture

### Tech Stack
- **Next.js 14** with App Router, React 18, TypeScript
- **Supabase** for PostgreSQL database, auth, and file storage
- **CSS Modules** with global CSS variables (no Tailwind) — warm earthy palette with Playfair Display / Lora / Inter fonts
- **Netlify** for deployment (`@netlify/plugin-nextjs`)

### Rendering Strategy
- **Home page** (`src/app/page.tsx`): Client component — manages filters, search, and favorites state via URL params
- **Recipe detail** (`src/app/recipe/[id]/page.tsx`): Server component for data fetching + OG metadata generation; delegates to `RecipeDetailClient.tsx` for interactions
- **Admin pages**: All client components with Supabase auth

### Data Layer
- Custom hooks in `src/hooks/` handle all Supabase queries (useRecipes, useLikes, useComments, useFavorites, useAuth)
- No Redux or Context — state lives in hooks and component-level useState
- Browser fingerprinting (`src/lib/fingerprint.ts`) enables likes/favorites without user accounts — fingerprint stored in localStorage

### Database (supabase-setup.sql)
Three tables with RLS enabled: `recipes` (main content), `recipe_comments`, `recipe_likes` (unique on recipe_id + browser_fingerprint). Ingredients, instructions, and tips are stored as newline-separated text.

### Admin Auth
- Supabase Auth with admin detection via `NEXT_PUBLIC_ADMIN_UID` env var comparison
- Login page has client-side rate limiting (5 attempts, 15-min lockout via localStorage)
- Admin can create/edit recipes with image upload (including clipboard paste)

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ADMIN_UID
```

### Path Alias
`@` maps to `src/` (configured in tsconfig.json).
