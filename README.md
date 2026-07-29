# BAGEL://HUB

A spatial PWA launcher built with Vite, TypeScript, Three.js, and Anime.js.

## Run it locally

Install dependencies once:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in the terminal. Changes reload automatically.

## Create a production build

```bash
npm run build
npm run preview
```

The production-ready files are generated in `dist/`.

## Add another app

1. Create a folder such as `apps/notes/`.
2. Give it an `index.html` and any TypeScript or CSS files it needs.
3. Add its tile metadata to `src/apps.ts`.

Vite automatically finds each `apps/*/index.html` entry during a build. Keep
apps on the same origin so they can be cached for offline use. Selecting a tile
navigates to the app as its own page; each app should include a link back to
`/`.

## PWA behavior

The PWA manifest is stored in `public/manifest.webmanifest`. A versioned service
worker is generated during production builds. The hub and built-in apps are
precached, while weather requests use a network-first strategy with a cached
fallback.
