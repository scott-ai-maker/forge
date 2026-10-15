import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/packages',
          '/audit',
          '/corporate',
          '/apps',
          '/exercises/',
          '/apply',
          '/whats-new',
          '/privacy',
          '/terms',
          '/async-coaching',
        ],
        disallow: ['/coach/', '/dashboard/', '/api/', '/auth/', '/preview/', '/test-harness/', '/credentials', '/documents/'],
      },
      {
        userAgent: [
          'CCBot',
          'Bytespider',
          'Diffbot',
          'Omgilibot',
          'FacebookBot',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://forge-athletic.app'}/sitemap.xml`,
  }
}
