# Factory Configuration
<!-- This file configures the Remote Factory for your project. -->
<!-- The factory reads this during Init mode and generates .factory/config.json from it. -->

## Goal

Improve code quality, test coverage, and add new features to the recipe blog.

## Scope

### Modifiable
<!-- Files and directories the factory is allowed to create or edit. -->

- nextjs-app/src/**/*.ts
- nextjs-app/src/**/*.tsx
- nextjs-app/src/**/*.css
- nextjs-app/src/**/*.test.ts
- nextjs-app/src/**/*.test.tsx
- nextjs-app/e2e/**/*.ts
- nextjs-app/package.json
- nextjs-app/tsconfig.json
- nextjs-app/jest.config.ts
- nextjs-app/playwright.config.ts
- nextjs-app/next.config.js
- eval/**

### Read-only
<!-- Files the factory may read but must never modify. -->

- supabase-setup.sql
- nextjs-app/.env.local
- CLAUDE.md

## Guards
<!-- Rules the factory must never violate. Checked before every commit. -->

- Do not modify supabase-setup.sql
- Do not delete or overwrite existing tests
- Do not change environment variable names (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_ADMIN_UID)
- Do not introduce secrets or credentials into the repository
- Do not modify files outside the declared scope

## Eval

### Command
<!-- The shell command the factory runs to score a change. -->

```bash
python3 eval/score.py
```

### Threshold
<!-- Minimum composite score (0.0-1.0) required to keep a change. -->

0.3

## Target Branch

main

## Eval Spec

```json
{
  "dimensions": [
    {
      "name": "tests",
      "command": "cd nextjs-app && npm test -- --ci --passWithNoTests 2>&1",
      "weight": 0.3,
      "parser": "regex",
      "regex_pattern": "Tests:.*?(\\d+) passed",
      "description": "Run Jest unit tests"
    },
    {
      "name": "lint",
      "command": "cd nextjs-app && npm run lint 2>&1",
      "weight": 0.2,
      "parser": "exit_code",
      "description": "Run ESLint"
    },
    {
      "name": "type_check",
      "command": "cd nextjs-app && npx tsc --noEmit 2>&1",
      "weight": 0.2,
      "parser": "exit_code",
      "description": "TypeScript type checking"
    },
    {
      "name": "build",
      "command": "cd nextjs-app && npm run build 2>&1",
      "weight": 0.2,
      "parser": "exit_code",
      "description": "Next.js production build"
    },
    {
      "name": "observability",
      "command": "(inline)",
      "weight": 0.1,
      "parser": "json",
      "description": "Analyze logging coverage, structured logging, and request tracing"
    }
  ]
}
```

## Smoke Test
<!-- Optional e2e smoke test command. Failure = mandatory revert. -->

```bash
cd nextjs-app && npx tsc --noEmit
```

## Hypothesis Budget

- min_growth: 1
- max_new: 2

## Constraints
<!-- Soft rules that guide behavior but don't block commits. -->

- Prefer small, incremental changes over large rewrites
- Each change should be accompanied by at least one test
- Follow the existing code style and conventions (CSS Modules, custom hooks pattern)
- Use the existing path alias @ for src/ imports
