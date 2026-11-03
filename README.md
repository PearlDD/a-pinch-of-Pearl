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

## Auto-calculate nutrition

Both recipe editors calculate from the complete current ingredient list, including the row being edited and text waiting in **+ Add**. Every click reparses quantities and food names from scratch. Editing ingredients or servings marks a previous calculation as stale; an unsuccessful calculation preserves all existing saved/manual nutrition inputs, explicitly reports that no new result was applied, and explains what needs fixing. Only a complete successful calculation replaces the five inputs. Saving also commits the visible ingredient draft.

The feedback separates **foods identified**, **amounts resolved**, and **estimates**, and lists reference weights and assumptions. A 100% food identification rate does not establish quantity accuracy. The default **Estimate unclear amounts using standard portions** option allows a missing quantity to use a food-specific standard portion. For example, an unspecified pasta portion assumes 55 g dry pasta; ¼ can tuna without a package weight uses one quarter of a stated 113 g drained-can reference. Each assumption is labelled for review, and measured amounts always take precedence. Quantity and serving ranges use a labelled midpoint in estimate mode. Blank servings display whole-recipe totals.

Turn the estimate option off to require explicit quantities for ambiguous portions/packages, preparation states and ranges. Unsupported foods or quantities still prevent a complete total and show actionable issues; neither mode invents a universal 100 g item or 400 g package. Recipes remain optional/editable nutrition estimates, rather than product-specific label data. Existing saved recipes are not automatically rewritten when code is deployed: recalculate, review and save in the editor.

Parsing supports Unicode/ASCII fractions, food-first quantities (`Garlic: 3 cloves, minced`), compatible additive measures (`¼ cup + 2½ tablespoons flour`), explicit package weights, common Chinese quantities/units/names, and recognized preparation notes. Section headings are excluded and disclosed. Brands, unspecified ingredient mixtures and unfamiliar units still need a matching reference or clarification; do not interpret an unsupported record as a verified nutrition result.

Common count/volume conversions use ingredient-specific estimates (including separate egg yolk/white weights). Dry/cooked pasta, canned fish, ground meat and sun-dried descriptors remain distinct. Household measures and the added pasta/anchovy data use [USDA SR28](https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip); standard portions use [FDA RACC examples](https://www.fda.gov/media/102587/download) and disclosed culinary defaults. Chia spoon weight uses the [Bob’s Red Mill label](https://www.bobsredmill.com/product/organic-chia-seed) (2 tbsp = 26 g). The missing-can-size estimate uses a [113 g drained tuna example](https://www.bumblebee.com/products/cans/bumble-bee-prime-solid-white-albacore-tuna-in-water-low-sodium/). Product sizes/compositions vary and assumptions are shown rather than treated as measurements. This calculator runs locally in the browser and makes no AI/API calls.

The regression fixtures cover all 40 published recipes (rescanned 2026-11-03), plus the reported 14-ingredient chicken-orzo soup. The estimate mode supports 38 of those 40 complete ingredient lists. The two open-ended Dumplings/Lu Wei guides still require the actual filling/main ingredient choices; possible ingredient lists are not silently treated as a complete measured recipe.

Common culinary wording includes celery sticks/stalks, ingredient-specific butter sticks and tofu packages, raw/uncooked chicken cuts, dry/cooked orzo, dried herb blends, salt & pepper, and measured components written in one row. Cups of dry orzo use a [San Giorgio household reference](https://www.sangiorgio.com/product/orzo/) (⅓ cup = 56 g), separately from cooked pasta. Explicit package weights override assumed sizes. Parenthetical preparation/ratio notes are not treated as ingredient weights. Matching counts retain the editor rows when a row contains multiple components; all components contribute to totals.

Estimate-only food-family proxies are explicitly listed in the review: e.g. generic protein powder, herb blends and regional sauces. A branded reduced-fat coconut milk can use a [Thai Kitchen Lite reference](https://www.mccormick.com/products/thai-kitchen-lite-coconut-milk-25-36-fl-oz); coconut creamer can use a [sweetened So Delicious reference](https://www.sodeliciousdairyfree.com/dairy-free-foods/dairy-free-creamers/organic-coconutmilk-creamers/french-vanilla). These are **not verified labels for the named brand**, and sugar/fat or recipe composition can differ substantially. Chili-bean paste uses a [Lee Kum Kee reference](https://uk.lkk.com/products/chilli-bean-sauce), with unlisted fibre estimated as zero. The generic oily hot-pot-base proxy explicitly assumes equal weights oil and chili sauce. Whole-chicken estimates disclose an assumed 65% edible yield. Use actual edible weights/product labels when available; the strict mode does not apply these uncertain family/size assumptions. Truly unknown foods and invalid numbers still produce an error, not an incomplete total disguised as a whole recipe.

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
| `npm run test:nutrition-browser` | Run isolated desktop/touch nutrition editor regressions with mocked Supabase |

End-to-end tests require the same Supabase environment variables as the application.
The isolated nutrition browser suite uses fake auth and recipe data, needs no API keys, and starts its own server on port 3005. Install Chromium first with `npx playwright install chromium` and stop any development server using that port before running it.

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

Netlify runs `npm run build` using Node 22 and explicitly applies the pinned current v5 Next.js adapter. This replaces the old v4 adapter and ensures App Router API routes are deployed even when automatic framework detection is disabled in the site's settings. If the site has a separately configured `AWS_LAMBDA_JS_RUNTIME`, ensure it uses Node 22 or later. Review the PR deploy preview before merging; verify browser startup and an authenticated import in the deployed Linux environment.

## License

No license has been specified for this repository. Add one before redistributing or accepting external contributions.
