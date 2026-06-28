import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { saveOAuthState } from "@/lib/linked-accounts"
import crypto from "crypto"

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ")

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const primaryEmail = session.user?.email ?? "unknown"
  const nonce = crypto.randomUUID()

  saveOAuthState(nonce, {
    primaryEmail,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })

  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? new URL(req.url).origin
  const redirectUri = `${base}/api/auth/link-google/callback`

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "select_account consent",
    state: nonce,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
