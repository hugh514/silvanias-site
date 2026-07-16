import { type NextRequest } from 'next/server'
import { updateSession } from './supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto:
     * - arquivos estáticos (_next/static, _next/image)
     * - favicon
     * - imagens comuns
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}