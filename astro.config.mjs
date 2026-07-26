// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});

// NOTE on Tailwind integration: we use Tailwind v4's official `@tailwindcss/vite`
// plugin (registered under `vite.plugins` below) rather than the older
// `@astrojs/tailwind` integration. `@astrojs/tailwind` targets Tailwind v3 and
// wires up a PostCSS pipeline + a JS `tailwind.config.js`; Tailwind v4 replaced
// that with a Vite-native plugin and CSS-first `@theme` configuration (see
// src/styles/global.css), which is the officially recommended path for new
// Astro + Tailwind v4 projects and avoids maintaining a redundant config file.
export default defineConfig({
  // Assumption: deployed to GitHub Pages at this project's default URL.
  // Update `site`/`base` here if the repo is renamed or deployed elsewhere
  // (e.g. a custom domain, in which case `base` should become '/').
  site: 'https://jlfassio-vibecoder.github.io/trp-binder',
  base: '/trp-binder',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
