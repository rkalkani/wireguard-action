# Development Guide

This guide covers how to develop, build, test, and release new versions of the WireGuard Action.

## Prerequisites

- Node.js 24.x or later
- pnpm 10.x or later

## Project Structure

```
wireguard-action/
├── src/                  # TypeScript source files
│   ├── main.ts           # Main action entry point
│   └── cleanup.ts        # Post-action cleanup
├── lib/                  # Compiled JavaScript (gitignored)
├── dist/                 # Bundled files for distribution (committed)
│   ├── index.js          # Bundled main action
│   └── cleanup/
│       └── index.js      # Bundled cleanup action
├── action.yml            # Action metadata
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md             # User documentation
```

## Development Workflow

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Make Changes

Edit the TypeScript files in `src/`:

- `src/main.ts` - Main action logic (install WireGuard, connect)
- `src/cleanup.ts` - Cleanup logic (disconnect, remove config)

### 3. Build

```bash
pnpm build
```

This runs:
1. `tsc` - Compiles TypeScript to JavaScript in `lib/`
2. `ncc` - Bundles everything into single files in `dist/`

### 4. Test Locally

You can test the action in a workflow by pushing to a branch and referencing it:

```yaml
- name: Setup WireGuard VPN
  uses: rkalkani/wireguard-action@your-branch
  with:
    wg-config-file: ${{ secrets.WG_CONFIG }}
```

### 5. Commit Changes

**Important**: Always commit the `dist/` folder. GitHub Actions runs the bundled code from `dist/`, not the source files.

```bash
git add .
git commit -m "Description of changes"
git push
```

## Releasing a New Version

### Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (v2.0.0): Breaking changes to inputs/outputs or behavior
- **MINOR** (v1.1.0): New features, backward compatible
- **PATCH** (v1.0.1): Bug fixes, backward compatible

### Release Steps

#### 1. Update Version in package.json

```bash
# For patch release (bug fixes)
pnpm version patch

# For minor release (new features)
pnpm version minor

# For major release (breaking changes)
pnpm version major
```

This automatically:
- Updates `version` in `package.json`
- Creates a git commit
- Creates a git tag (e.g., `v1.0.1`)

#### 2. Push Changes and Tags

```bash
git push origin main --tags
```

#### 3. Create GitHub Release

1. Go to your repository on GitHub
2. Click **Releases** in the right sidebar
3. Click **Draft a new release**
4. Select the tag you just pushed (e.g., `v1.0.1`)
5. Set the release title (e.g., `v1.0.1`)
6. Write release notes describing changes
7. Click **Publish release**

#### 4. Update Major Version Tag

Users often reference major versions (e.g., `@v1`). Update the major version tag to point to the latest release:

```bash
# Delete the old v1 tag locally and remotely
git tag -d v1
git push origin :refs/tags/v1

# Create new v1 tag pointing to latest commit
git tag v1
git push origin v1
```

## Publishing to GitHub Marketplace

### First-Time Publishing

1. Go to your repository on GitHub
2. Click **Releases** → **Draft a new release**
3. You'll see a checkbox: **Publish this Action to the GitHub Marketplace**
4. Check the box
5. GitHub will validate your `action.yml`:
   - Must have `name`, `description`, and `author`
   - Must have `branding` with `icon` and `color`
6. Select a **Primary Category** (e.g., "Deployment", "Utilities")
7. Select a **Secondary Category** (optional)
8. Complete the release

### Requirements for Marketplace

Your `action.yml` must include:

```yaml
name: 'WireGuard Action'
description: 'Set up a WireGuard VPN connection...'
author: 'rkalkani'
branding:
  icon: 'shield'        # From Feather icons
  color: 'red'          # blue, green, orange, purple, red, white, yellow, gray-dark
```

### Updating Marketplace Listing

The marketplace listing updates automatically when you:
- Create a new release
- Update the `README.md` (used as the marketplace description)

### Marketplace Best Practices

1. **Clear README**: The README is displayed on the marketplace page
2. **Good examples**: Show common use cases in the README
3. **Semantic versioning**: Users trust properly versioned actions
4. **Changelog**: Document changes in release notes

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf node_modules lib dist
pnpm install
pnpm build
```

### TypeScript Errors

```bash
# Check for type errors without building
pnpm exec tsc --noEmit
```

### Testing Changes

Create a test workflow in `.github/workflows/test.yml`:

```yaml
name: Test Action

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test WireGuard Action
        uses: ./
        with:
          wg-config-file: ${{ secrets.WG_CONFIG }}

      - name: Verify connection
        run: |
          # Check if interface exists
          ip link show wg0
          # Show WireGuard status
          sudo wg show
```

## Code Style

This project uses ESLint and Prettier for code quality and formatting.

### Linting and Formatting Commands

```bash
# Check formatting
pnpm format:check

# Fix formatting
pnpm format

# Run linter
pnpm lint

# Fix lint issues
pnpm lint:fix

# Run both format check and lint
pnpm check
```

### Style Guidelines

- Use TypeScript strict mode
- Handle errors with proper type checking (`instanceof Error`)
- Use `core.info()` for informational messages
- Use `core.warning()` for non-fatal issues
- Use `core.setFailed()` for fatal errors in main action
- Use `core.warning()` for errors in cleanup (don't fail the job)

## Dependencies

| Package | Purpose |
|---------|---------|
| `@actions/core` | GitHub Actions toolkit - inputs, outputs, logging |
| `@actions/exec` | Execute shell commands |
| `typescript` | TypeScript compiler |
| `@vercel/ncc` | Bundle into single file |
| `@types/node` | Node.js type definitions |
| `eslint` | Code linting |
| `prettier` | Code formatting |
| `typescript-eslint` | TypeScript ESLint parser and rules |
| `eslint-config-prettier` | Disables ESLint rules that conflict with Prettier |
