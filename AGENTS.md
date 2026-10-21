# AGENTS.md

## Commands

- Run: open `index.html` in a browser, or `npx serve .` (no dev server, no bundler, no dependencies).
- Build: `pnpm build` — just copies `index.html`, `game.js`, `favicon.svg` into `dist/`. Only used by CI for GitHub Pages.
- There are no tests, lint, or typecheck. Verify changes by playing the game in a browser.
- pnpm is the package manager (`pnpm@11` pinned in `package.json`), but nothing installs — `node_modules` is irrelevant.

## Architecture

- Entire game lives in one file: `game.js` (~900 lines). `index.html` loads it via a plain `<script>` tag — no imports, no modules.
- Canvas is fixed 800×600; world is toroidal (all entities wrap edges via `wrap()`).
- Game state that persists (chosen skin, unlocked skins, high scores) is stored in `localStorage`. When testing skin unlocks, clear the site's `localStorage` first.
- Adding a feature means editing `game.js` in place; no codegen or build step needed to see changes — just reload the page.

## Conventions

- Code and comments in `game.js` must be in **English** (explicit repo rule, see README). README prose is Spanish — keep it that way.

## Releases / CI

- PRs merged into `develop` trigger `.github/workflows/develop-release.yml`: auto patch-bump, tag `vX.Y.Z-dev.N` (N = run number), GitHub prerelease, Pages deploy from `dist/`. Direct pushes to `develop` do **not** release — always use a PR.
- Do not bump `version` in `package.json` yourself unless intentionally overriding the auto-bump (workflow detects and preserves manual bumps).
- CI rewrites `package.json` with tab indentation and a trailing newline — match that format when editing it.
- Stable releases are manual: `workflow_dispatch` on `main` (`.github/workflows/main-release.yml`) with `version` and `label` inputs; creates tag `vX.Y.Z` and a normal release. Does not touch Pages.
- Branch naming: numbered feature branches (e.g. `05-worktrees-merge-shot-skin-shield`) merged into `develop`; `main` holds stable releases only.
- `.github/dictation.md` is for a different project (weather-ai); ignore it.
