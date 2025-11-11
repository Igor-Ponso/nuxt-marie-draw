# Marie Draw

A delightful Nuxt 3 single-page experience for running local prize draws with cinematic suspense.

## Features

- ✨ Elegant glassmorphism-inspired interface with smooth motion and gradients
- 🧾 Add, remove, and persist entrants locally — duplicate names naturally improve odds
- 🎰 Animated highlight reel builds anticipation before revealing the winner
- 🎉 Lightweight confetti celebration seals the moment
- 🚀 Ready for static deployment (GitHub Pages friendly)

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to run the draw.

## Deploying to GitHub Pages

The project is preconfigured with `nitro.preset = "github-pages"` and a configurable base URL. For repository-based pages, set the base path before building:

```bash
export NUXT_PUBLIC_BASE_PATH="/your-repo-name/"
npm run generate
```

Upload the generated `dist/` directory to the `gh-pages` branch (or configure your CI to do so).
