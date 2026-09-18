# A Pinch of Pearl

A warm, personal recipe blog built with Next.js and Supabase. Visitors can browse, search, save, like, and comment on recipes; the site owner can manage the recipe collection through a protected admin area.

## Features

- Browse recipes by category or search by name, category, and description
- View ingredients, method, preparation details, nutrition, source links, photos, and videos
- Save favorites locally without creating an account
- Like recipes using a privacy-friendly browser fingerprint
- Read and leave recipe comments
- Manage recipes from an admin dashboard, including image uploads and clipboard-paste images
- Generate recipe-page metadata for sharing

## Built with

- [Next.js 14](https://nextjs.org/) with the App Router, React, TypeScript, and CSS Modules
- [Supabase](https://supabase.com/) for PostgreSQL, authentication, and image storage
- [Netlify](https://www.netlify.com/) for deployment
- Jest + React Testing Library for unit and component tests
- Playwright for end-to-end tests

## Getting started

### Prerequisites

- Node.js 18.17 or later
- A Supabase project

### Install and run

```bash
git clone https://github.com/PearlDD/a-pinch-of-Pearl.git
cd a-pinch-of-Pearl/nextjs-app
npm install
```

Create `nextjs-app/.env.local` with your Supabase settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_UID=your-supabase-user-id
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Set up Supabase

1. Create a new Supabase project.
2. In the Supabase SQL Editor, run [`supabase-setup.sql`](./supabase-setup.sql). It creates the recipe, comment, and like tables, indexes, and row-level security policies.
3. In Supabase Authentication, create the user who will manage recipes.
4. Copy that user's UUID into `NEXT_PUBLIC_ADMIN_UID`.
5. Copy the project URL and anonymous key from **Project Settings → API** into `.env.local`.
6. Create a public Storage bucket named `recipe photos` if you plan to use image uploads.

> Keep `.env.local` private. It is intentionally excluded from version control.

## Admin access

Visit `/admin/login` and sign in with the Supabase user whose ID matches `NEXT_PUBLIC_ADMIN_UID`. The admin area lets you add, edit, and remove recipes, and includes simple activity statistics on recipe cards.

## Available commands

Run these from `nextjs-app/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the production application |
| `npm start` | Run the production server after building |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run Jest with coverage reporting |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:ui` | Open Playwright's interactive test runner |

End-to-end tests require the same Supabase environment variables as the application.

## Project structure

```text
.
├── nextjs-app/
│   ├── src/app/          # Pages and route-level styles
│   ├── src/components/   # Reusable UI components
│   ├── src/hooks/        # Supabase data and interaction hooks
│   ├── src/lib/          # Types, Supabase client, utilities
│   ├── e2e/              # Playwright specifications
│   └── netlify.toml      # Netlify build configuration
├── supabase-setup.sql    # Database schema and RLS policies
└── eval/                 # Project evaluation utilities
```

## Deployment

The app is configured for Netlify. Connect the repository to a Netlify site, use `nextjs-app` as the base directory, and add the three environment variables listed above in the site's environment settings. Netlify will run `npm run build` and use the included Next.js plugin.

## License

No license has been specified for this repository. Add one before redistributing or accepting external contributions.
