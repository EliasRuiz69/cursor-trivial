'use client'

/**
 * Wrapper cliente para NextAuth SessionProvider.
 * Necesario porque SessionProvider usa contexto de React (client-side only).
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export default function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
