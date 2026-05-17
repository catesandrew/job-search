import { NextResponse } from 'next/server'

// After NextAuth clears its own session cookie, redirect here to also
// end the upstream Zitadel SSO session via the OIDC end_session endpoint.
// Without this, Zitadel remembers the session and auto-logs the user back in.
export async function GET() {
  const zitadelIssuer = process.env.ZITADEL_ISSUER
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  if (zitadelIssuer) {
    const endSessionUrl = new URL(`${zitadelIssuer}/oidc/v1/end_session`)
    endSessionUrl.searchParams.set('post_logout_redirect_uri', `${baseUrl}/login`)
    return NextResponse.redirect(endSessionUrl)
  }

  return NextResponse.redirect(new URL('/login', baseUrl))
}
