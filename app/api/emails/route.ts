import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listThreadIds, fetchThreadsByIds } from "@/lib/gmail"
import { categorizeThreads } from "@/lib/claude"
import { readCacheMap, writeCacheMap } from "@/lib/cache"
import { CategorizedThread } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  if (session.error === "RefreshTokenError") {
    return NextResponse.json(
      { error: "Your Google session expired. Please sign out and sign back in." },
      { status: 401 }
    )
  }

  const apiKey = req.headers.get("x-anthropic-api-key") || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const force = req.nextUrl.searchParams.get("force") === "true"

  try {
    const currentIds = await listThreadIds(session.accessToken, 40)

    const cacheData = force ? null : readCacheMap<CategorizedThread>(userEmail)
    const cached = cacheData ? { ...cacheData.emails } : {}

    const newIds = currentIds.filter((id) => !cached[id])

    if (newIds.length > 0) {
      const newThreads = await fetchThreadsByIds(session.accessToken, newIds)
      const existingCategories = [...new Set(Object.values(cached).map((t) => t.category))]
      const categorized = await categorizeThreads(apiKey, newThreads, existingCategories)
      for (const thread of categorized) {
        cached[thread.id] = thread
      }
      writeCacheMap<CategorizedThread>(userEmail, cached)
    }

    const threads = currentIds.map((id) => cached[id]).filter(Boolean)
    const updatedAt = newIds.length === 0 && cacheData ? cacheData.updatedAt : new Date().toISOString()

    return NextResponse.json({ threads, cachedAt: updatedAt, newCount: newIds.length })
  } catch (err: any) {
    console.error("[/api/emails]", err?.message ?? err)

    const cached = readCacheMap<CategorizedThread>(userEmail)
    if (cached && !force) {
      const threads = Object.values(cached.emails)
      return NextResponse.json({ threads, cachedAt: cached.updatedAt, newCount: 0 })
    }

    return NextResponse.json(
      { error: err?.message || "Failed to load emails" },
      { status: 500 }
    )
  }
}
