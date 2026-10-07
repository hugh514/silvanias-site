import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const urlSite = process.env.NEXT_PUBLIC_SITE_URL || 'https://silvanias-site.vercel.app'

// Sem cookies: o sitemap não tem request, e o catálogo disponível é público.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, created_at')
    .eq('disponivel', true)

  return [
    { url: urlSite },
    ...(produtos ?? []).map((p) => ({
      url: `${urlSite}/produtos/${p.id}`,
      lastModified: p.created_at,
    })),
  ]
}
