import type { MetadataRoute } from 'next'

const urlSite = process.env.NEXT_PUBLIC_SITE_URL || 'https://silvanias-site.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${urlSite}/sitemap.xml`,
  }
}
