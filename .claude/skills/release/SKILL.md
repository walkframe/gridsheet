---
name: release
description: Release GridSheet packages — bump versions and publish. Use when the user wants to cut a release, bump the version, publish to npm, ship a new version of @gridsheet/* packages, or release the csv-gridsheet VSCode extension.
---

# Releasing GridSheet

Two independent release tracks: the **npm packages** (all `@gridsheet/*` publishable packages,
versioned together) and the **VSCode extension** (`csv-gridsheet`, versioned separately).

Publishing happens in **GitHub Actions**, not locally — you never run `npm publish` by hand.
Your job is to bump versions, commit, and push the right ref to trigger the workflow.

> **Pushing**: the `origin` remote is SSH (`git@github.com:...`), which fails in this environment.
> Push commits and tags over **https via `gh`** (e.g. `gh auth setup-git` then push, or push to
> `https://github.com/walkframe/gridsheet.git`), **not** the SSH `origin`.

## Before you start

1. Confirm the target version with the user (e.g. `3.5.0`, or a prerelease like `3.5.0-rc.1`).
2. Make sure the working tree is clean and you're on `master` (or a `fix/*` branch).
3. Run `pnpm build:all`, `pnpm jest`, and ideally `pnpm e2e` — a broken publish is worse than a slow one.

## Track A — npm packages (`@gridsheet/*`)

All publishable packages share ONE version. `scripts/set-version.mjs` handles the bump.

1. **Bump + commit + tag** (one command does all three):
   ```bash
   pnpm set-version <version>
   ```
   This: sets every non-private, non-`0.0.0` package to `<version>`, rewrites cross-package deps to
   match, `git commit -m "<version>"`, and creates a `v<version>/<pkg-shortname>` tag per package
   (e.g. `v3.5.0/react-core`). Private packages (`docs`, `storybook`, `csv-gridsheet`) are skipped.

2. **Push to `master`** — this is what triggers publishing:
   ```bash
   gh api ...   # or push over https
   git push https://github.com/walkframe/gridsheet.git master
   git push https://github.com/walkframe/gridsheet.git --tags
   ```
   The `release` workflow (`.github/workflows/release.yaml`) triggers on **push to `master`**
   (the commit, not the tags). It publishes in dependency order via npm **trusted publishing / OIDC**
   (`--provenance`, no tokens/secrets), waiting for each package to appear on npm before publishing
   its dependents. Prerelease versions (containing `-`) publish under `--tag next`.

3. **Watch it**: `gh run watch` / `gh run list --workflow=release.yaml`.

The tags are for history/reference; the VSCode workflow is the only one that keys off a tag.

## Track B — VSCode extension (`csv-gridsheet`)

The extension is a private package versioned **independently** (currently on a `0.x` line).
`set-version` does NOT touch it — bump it by hand.

1. Edit the version in `packages/vscode-csv-viewer/package.json`.
2. Commit it (and update its CHANGELOG if present).
3. Create and push a tag `v<version>/csv-gridsheet` matching that version exactly:
   ```bash
   git tag v<version>/csv-gridsheet
   git push https://github.com/walkframe/gridsheet.git v<version>/csv-gridsheet
   ```
   The `release-vscode` workflow triggers on `v*/csv-gridsheet` tags. It **verifies the tag version
   equals package.json version** (fails otherwise), builds preact-core + functions + the extension,
   and publishes to the **VS Code Marketplace** (`vsce`, `VSCE_PAT` secret) and **Open VSX**
   (`ovsx`, `OVSX_TOKEN` secret).

## Notes

- Docs deploy separately on push to `master` (`deploy-docs.yml` → Cloudflare Pages); no action needed.
- To remove bad tags locally, `pnpm delete-tags` (see `scripts/delete-tags.mjs`).
- End the release commit / any PR body with the attribution lines this session requires.
