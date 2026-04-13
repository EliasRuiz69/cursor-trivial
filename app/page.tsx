/**
 * app/page.tsx
 * Ruta raíz — redirige a /login o /welcome según el estado de sesión.
 */

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/welcome')
  } else {
    redirect('/login')
  }
}
