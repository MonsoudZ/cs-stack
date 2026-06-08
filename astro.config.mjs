import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Used to build absolute canonical/OG URLs, the sitemap, and robots.txt.
  // This is the ONLY place the deployed origin lives — change it here on launch.
  site: 'https://cs-stack.pages.dev',

  // pagefind() builds the search index after `astro build` AND serves it under
  // /pagefind in dev/preview (plain `astro preview` won't serve post-build files).
  integrations: [svelte(), sitemap(), pagefind()],

  adapter: cloudflare(),
});