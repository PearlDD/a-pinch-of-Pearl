# Builder Review — Eval Harness Fix

## Summary

Rewrote the eval harness to properly target the Next.js 14 / TypeScript project structure. The previous harness was auto-generated with a fallback `syntax_check` (just `true`) and a Python-only observability scan — neither matched this project.

## Changes Made

### `.factory/eval_profile.json`
- Set `project_type` to `nextjs`, `tier` to `explicit`, `confidence` to `0.9`
- Replaced `syntax_check` (weight 0.83, command `true`) with 4 real dimensions:
  - **tests** (0.3): `cd nextjs-app && npm test -- --ci --passWithNoTests` with regex parser for passed count
  - **lint** (0.2): `cd nextjs-app && npm run lint` with exit_code parser
  - **type_check** (0.2): `cd nextjs-app && npx tsc --noEmit` with exit_code parser
  - **build** (0.2): `cd nextjs-app && npm run build` with exit_code parser
- Updated **observability** (0.1) to scan `.ts`/`.tsx` files in `nextjs-app/src/` instead of `.py` files

### `eval/score.py`
- Rewrote all eval functions to run from PROJECT_ROOT with `cwd` set correctly
- Each function uses `subprocess.run` with `bash -c` to handle the `cd nextjs-app && ...` commands
- Timeouts: 300s for build, 120s for all others
- `eval_tests`: regex parser extracts passed count from Jest output
- `eval_lint`, `eval_type_check`, `eval_build`: exit_code parser with meaningful detail messages
- `eval_type_check`: partial scoring — deducts 0.1 per `error TS` line
- `eval_observability`: scans `nextjs-app/src/**/*.{ts,tsx}`, skipping test/build dirs; checks for `console.log/warn/error`, structured logging libs (pino, winston), and tracing patterns

## Verification

Ran `python3 eval/score.py` — produces valid JSON with all 5 dimensions. Current scores reflect pre-existing project issues (ESLint not configured, type errors, build failure due to missing Supabase env vars), not eval harness bugs.
