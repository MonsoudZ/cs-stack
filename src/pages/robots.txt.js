// Generated at build time from `site` in astro.config.mjs — the sitemap URL
// tracks the deployed origin automatically, so there's no second place to edit.
const body = (sitemapURL) => `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export function GET({ site }) {
  return new Response(body(new URL('sitemap-index.xml', site)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
