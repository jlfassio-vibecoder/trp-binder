// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// NOTE on Tailwind integration: we use Tailwind v4's official `@tailwindcss/vite`
// plugin (registered under `vite.plugins` below) rather than the older
// `@astrojs/tailwind` integration. `@astrojs/tailwind` targets Tailwind v3 and
// wires up a PostCSS pipeline + a JS `tailwind.config.js`; Tailwind v4 replaced
// that with a Vite-native plugin and CSS-first `@theme` configuration (see
// src/styles/global.css), which is the officially recommended path for new
// Astro + Tailwind v4 projects and avoids maintaining a redundant config file.
export default defineConfig({
  // Assumption: deployed to GitHub Pages at this project's default URL
  // (https://jlfassio-vibecoder.github.io/trp-binder). Since there's no
  // CNAME/custom domain in this repo, `base` must stay '/trp-binder' or the
  // built site's asset links (JS/CSS) will 404 once deployed. Only drop
  // `site`/`base` if this repo is renamed to jlfassio-vibecoder.github.io or
  // a custom domain is configured (a public/CNAME file).
  site: 'https://jlfassio-vibecoder.github.io/trp-binder',
  base: '/trp-binder',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
