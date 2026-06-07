import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listEmailIds, fetchEmailsByIds } from "@/lib/gmail"
import { categorizeEmails } from "@/lib/claude"
import { readCacheMap, writeCacheMap } from "@/lib/cache"

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

  try {
    const currentIds = await listEmailIds(session.accessToken, 40)

    const cacheData = force ? null : readCacheMap(userEmail)
    const cachedEmails = cacheData ? { ...cacheData.emails } : {}

    const newIds = currentIds.filter((id) => !cachedEmails[id])

    if (newIds.length > 0) {
      const newEmails = await fetchEmailsByIds(session.accessToken, newIds)
      const existingCategories = [...new Set(Object.values(cachedEmails).map((e) => e.category))]
      const newCategorized = await categorizeEmails(apiKey, newEmails, existingCategories)
      for (const email of newCategorized) {
        cachedEmails[email.id] = email
      }
      writeCacheMap(userEmail, cachedEmails)
    }

    const emails = currentIds.map((id) => cachedEmails[id]).filter(Boolean)
    const updatedAt = (newIds.length === 0 && cacheData) ? cacheData.updatedAt : new Date().toISOString()

    return NextResponse.json({ emails, cachedAt: updatedAt, newCount: newIds.length })
  } catch (err: any) {
    console.error("[/api/emails]", err?.message ?? err)

    // Fall back to whatever is in cache rather than showing an error
    const cached = readCacheMap(userEmail)
    if (cached && !force) {
      const emails = Object.values(cached.emails)
      return NextResponse.json({ emails, cachedAt: cached.updatedAt, newCount: 0 })
    }

    return NextResponse.json(
      { error: err?.message || "Failed to load emails" },
      { status: 500 }
    )
  }
}
