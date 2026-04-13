/**
 * app/api/auth/[...nextauth]/route.ts
 * NextAuth con proveedor Credentials (email + contraseña hasheada con bcrypt).
 */

import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const supabase = createServerSupabaseClient()

          const { data: profile } = await supabase
            .from('player_profiles')
            .select('user_id, display_name, password_hash')
            .eq('user_id', credentials.email.toLowerCase())
            .single()

          if (!profile?.password_hash) return null

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            profile.password_hash
          )
          if (!passwordMatch) return null

          return {
            id: profile.user_id,
            email: profile.user_id,
            name: profile.display_name,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email
        token.name = user.name
      }
      return token
    },

    async session({ session, token }) {
      if (token.email) {
        session.user = {
          email: token.email as string,
          name: token.name as string,
          image: null,
        }
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return `${baseUrl}/welcome`
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
