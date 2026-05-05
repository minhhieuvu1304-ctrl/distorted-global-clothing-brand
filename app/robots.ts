import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

/**
 * /robots.txt — Next 14 native generator.
 *
 * Allows all standard crawling and points to the dynamically-generated
 * sitemap. The /api/* tree is disallowed because those endpoints are
 * server-only; nothing useful for a crawler to fetch there.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${siteConfig.meta.url}/sitemap.xml`,
  };
}
