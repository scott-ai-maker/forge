import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/async-coaching', '/packages', '/apply', '/whats-new', '/terms', '/privacy'],
        disallow: ['/coach/', '/dashboard/', '/api/', '/auth/'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'ClaudeBot',
          'Google-Extended',
          'Bytespider',
          'Diffbot',
          'PerplexityBot',
          'Omgilibot',
          'FacebookBot',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: 'https://gordonathleticadvisory.com/sitemap.xml',
  }
}

