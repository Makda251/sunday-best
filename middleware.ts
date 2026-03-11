import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Routes accessible without being logged in
const PUBLIC_PATHS = ['/sell', '/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always refresh session first
  const response = await updateSession(request)

  // Allow /sell, /auth/*, /api/* through without auth check
  if (
    pathname.startsWith('/sell') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api')
  ) {
    return response
  }

  // Check if user is authenticated
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated users can only access /sell
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sell'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
