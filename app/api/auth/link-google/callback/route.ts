import { NextRequest, NextResponse } from "next/server"
import { consumeOAuthState, addLinkedAccount } from "@/lib/linked-accounts"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? new URL(req.url).origin
  const settingsUrl = `${base}/settings`

  if (error || !code || !state) {
    return NextResponse.redirect(`${settingsUrl}?linked=error&reason=${error ?? "missing_params"}`)
  }

  const oauthState = consumeOAuthState(state)
  if (!oauthState) {
    return NextResponse.redirect(`${settingsUrl}?linked=error&reason=invalid_state`)
  }

  const redirectUri = `${base}/api/auth/link-google/callback`

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })
    if (!tokenRes.ok) throw new Error(await tokenRes.text())
    const tokens = await tokenRes.json()

    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${settingsUrl}?linked=error&reason=no_refresh_token`)
    }

    // Fetch user info for the newly linked account
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!userRes.ok) throw new Error(await userRes.text())
    const user = await userRes.json()

    if (user.email === oauthState.primaryEmail) {
      return NextResponse.redirect(`${settingsUrl}?linked=same-account`)
    }

    addLinkedAccount(oauthState.primaryEmail, {
      email: user.email,
      name: user.name ?? user.email,
      picture: user.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    })

    return NextResponse.redirect(`${settingsUrl}?linked=success`)
  } catch (err) {
    console.error("[link-google/callback]", err)
    return NextResponse.redirect(`${settingsUrl}?linked=error&reason=server_error`)
  }
}
