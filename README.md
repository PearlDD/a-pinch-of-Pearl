# A Pinch of Pearl

A warm, personal recipe blog built with Next.js and Supabase. Visitors can browse, search, save, like, and comment on recipes; the site owner can manage the recipe collection through a protected admin area.

## Features

- Browse recipes by category or search by name, category, and description
- View ingredients, method, preparation details, nutrition, source links, photos, and videos
- Save favorites locally without creating an account
- Like recipes using a privacy-friendly browser fingerprint
- Read and leave recipe comments
- Manage recipes from an admin dashboard, including image uploads and clipboard-paste images
- Import recipe links, copied text, AI answers, or short videos into a reviewable recipe form
- Generate recipe-page metadata for sharing

## Built with

- [Next.js 14](https://nextjs.org/) with the App Router, React, TypeScript, and CSS Modules
- [Supabase](https://supabase.com/) for PostgreSQL, authentication, and image storage
- [Netlify](https://www.netlify.com/) for deployment
- Jest + React Testing Library for unit and component tests
- Playwright for end-to-end tests

## Getting started

### Prerequisites

- Node.js 22 (also selected for Netlify builds)
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

## Recipe import

The **Add New Recipe** page includes an import panel. Paste a recipe link or recipe text, preview the result, and explicitly apply it to the form. Existing fields are preserved unless you choose to replace them. Importing does not save or publish a recipe, and missing times, quantities, servings, and nutrition are not inferred. Photos are not copied automatically.

Standard Recipe JSON-LD pages and clearly labelled ingredient/instruction text can be parsed without AI. Dynamic share pages are loaded in a server-side browser. Video import supports accessible MP4/WebM clips up to 80 MB and five minutes, using subtitles or speech plus sampled frames; review the result for omitted ingredients and steps. Login-protected, unavailable, or unsupported sources may still need pasted text or a transcript. ChatGPT shares must contain a readable assistant answer.

Copy the settings from [`nextjs-app/.env.example`](./nextjs-app/.env.example) into `.env.local` for development, and configure the same **server-side** variables in Netlify for deployed imports:

```dotenv
RECIPE_AI_PROVIDER=gemini
GEMINI_API_KEY=your-google-ai-studio-api-key
```

Gemini handles both transcription and recipe extraction. Optional `GEMINI_RECIPE_MODEL` and `GEMINI_TRANSCRIPTION_MODEL` overrides default to `gemini-3.5-flash-lite`. `GOOGLE_API_KEY` is also accepted as an alias for `GEMINI_API_KEY`. To use OpenAI instead, set `RECIPE_AI_PROVIDER=openai` and `OPENAI_API_KEY`; its optional model settings are `RECIPE_IMPORT_MODEL` (default `gpt-4o-mini`) and `RECIPE_TRANSCRIPTION_MODEL` (default `whisper-1`). The importer does not switch providers after an error. Without an explicit provider, a Google key selects Gemini; otherwise OpenAI is used.

Keep AI keys server-only: never add a `NEXT_PUBLIC_` prefix or commit `.env.local`. AI-assisted imports send source text, audio, and sampled video images to the selected provider and use that API project's quota or billing. Provider quota and access failures stop further AI requests.

For local dynamic-page/video imports, install Chromium with `npx playwright install chromium`, or set `RECIPE_BROWSER_EXECUTABLE_PATH` to an existing Chromium executable. Linux deployments use the bundled `@sparticuz/chromium` binary; the Next.js configuration includes its assets in the import function's build trace. Browser and media requests validate public IP destinations and enforce transfer/time limits. Video processing runs through separately authenticated requests to fit Netlify's function time and payload limits.

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

The app is configured for Netlify. Connect the repository to a Netlify site, use `nextjs-app` as the base directory, and add the three Supabase environment variables in the site's environment settings. For AI imports, also add `RECIPE_AI_PROVIDER=gemini` and the server-only `GEMINI_API_KEY`, with Functions scope and the deployment contexts you want to test. Redeploy after changing environment variables. Local `.env.local` files are not uploaded.

Netlify runs `npm run build` using Node 22 and automatically applies its current Next.js adapter. The old pinned v4 plugin is removed so App Router API routes use the supported adapter. If the site has a separately configured `AWS_LAMBDA_JS_RUNTIME`, ensure it uses Node 22 or later. Review the PR deploy preview before merging; verify browser startup and an authenticated import in the deployed Linux environment.

## License

No license has been specified for this repository. Add one before redistributing or accepting external contributions.
