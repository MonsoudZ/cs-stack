import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

export default defineConfig({
  // Used to build absolute canonical/OG URLs. Change to your deployed origin.
  site: 'https://the-stack.example.com',
  integrations: [svelte(), mdx()],
});
