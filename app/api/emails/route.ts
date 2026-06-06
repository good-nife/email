import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listEmails } from "@/lib/gmail"
import { categorizeEmails } from "@/lib/claude"
import { readCache, writeCache } from "@/lib/cache"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const force = req.nextUrl.searchParams.get("force") === "true"

  if (!force) {
    const cached = readCache(userEmail)
    if (cached) {
      return NextResponse.json({ emails: cached.emails, cachedAt: cached.cachedAt })
    }
  }

  const emails = await listEmails(session.accessToken, 40)
  const categorized = await categorizeEmails(apiKey, emails)
  writeCache(userEmail, categorized)

  return NextResponse.json({ emails: categorized, cachedAt: new Date().toISOString() })
}
