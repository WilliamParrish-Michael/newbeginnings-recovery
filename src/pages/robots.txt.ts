import type { APIRoute } from 'astro';

// Dynamic robots.txt so the Sitemap URL is correct on both the staging host
// (github.io/<base>) and the production domain (base '/'). At production
// cut-over this resolves to https://newbeginningsrecovery.com/sitemap-index.xml.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const origin = site?.origin ?? 'https://newbeginningsrecovery.com';
  const sitemap = `${origin}${base}/sitemap-index.xml`;
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
