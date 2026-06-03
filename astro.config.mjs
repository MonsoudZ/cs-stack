import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Used to build absolute canonical/OG URLs, the sitemap, and robots.txt.
  // This is the ONLY place the deployed origin lives — change it here on launch.
  site: 'https://the-stack.example.com',
  integrations: [svelte(), mdx(), sitemap()],
});
