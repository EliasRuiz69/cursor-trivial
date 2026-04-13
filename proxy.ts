/**
 * middleware.ts
 * Protege las rutas del juego: redirige a /login si no hay sesión.
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Aplicar middleware solo a las rutas del juego
export const config = {
  matcher: ['/welcome', '/play'],
}
