import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export function getServerSession() {
  return nextAuthGetServerSession(authOptions)
}

export async function requireSession() {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
