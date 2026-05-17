import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import ZitadelProvider from 'next-auth/providers/zitadel'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const zitadelEnabled = !!(process.env.ZITADEL_ISSUER && process.env.ZITADEL_CLIENT_ID)

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    // Zitadel OIDC — Authorization Code + PKCE (no client secret)
    ...(zitadelEnabled
      ? [
          process.env.ZITADEL_CLIENT_SECRET
            ? // Code flow WITH client secret (standard Web app in Zitadel)
              ZitadelProvider({
                issuer: process.env.ZITADEL_ISSUER!,
                clientId: process.env.ZITADEL_CLIENT_ID!,
                clientSecret: process.env.ZITADEL_CLIENT_SECRET,
              })
            : // Code flow WITHOUT secret — PKCE only (Native app or Web app with PKCE auth method)
              {
                ...ZitadelProvider({
                  issuer: process.env.ZITADEL_ISSUER!,
                  clientId: process.env.ZITADEL_CLIENT_ID!,
                  clientSecret: '',
                }),
                client: { token_endpoint_auth_method: 'none' as const },
                checks: ['pkce' as 'pkce', 'state' as 'state'],
              },
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null
        const isValid = await compare(credentials.password, user.passwordHash)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'zitadel' && account.access_token) {
        // Zitadel doesn't include user claims in the ID token by default —
        // fetch them from the userinfo endpoint using the access token
        try {
          const res = await fetch(`${process.env.ZITADEL_ISSUER}/oidc/v1/userinfo`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
          })
          if (res.ok) {
            const info = await res.json() as Record<string, string | undefined>
            user.email = info.email ?? user.email
            user.name =
              info.name ||
              [info.given_name, info.family_name].filter(Boolean).join(' ') ||
              info.preferred_username ||
              user.email
          }
        } catch {
          // userinfo fetch failed — fall back to email as name
          user.name = user.name || user.email
        }

        const email = user.email!
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          const created = await prisma.user.create({
            data: { email, name: user.name ?? email, passwordHash: '' },
          })
          user.id = created.id
        } else {
          user.id = existing.id
          if (!user.name) user.name = existing.name ?? email
        }
      }
      return true
    },
    jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        if (user.name) token.name = user.name
      }
      // With "Include user's profile info in the ID Token" enabled in Zitadel,
      // profile now has name/email claims — use as fallback if user.name wasn't set
      if (profile && !token.name) {
        const p = profile as Record<string, string | undefined>
        token.name =
          p.name ||
          [p.given_name, p.family_name].filter(Boolean).join(' ') ||
          p.preferred_username ||
          p.email
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
}
