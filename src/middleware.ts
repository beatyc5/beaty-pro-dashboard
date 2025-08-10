import { NextResponse, type NextRequest } from 'next/server'

// Temporarily disable auth enforcement in middleware since the app uses
// client-side session (localStorage) rather than auth cookies. This avoids
// blocking navigation after sign-in. Client-side guards will protect pages.
export async function middleware(request: NextRequest) {
  // Always allow navigation
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
