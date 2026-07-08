import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listThreadIds, fetchThreadsByIds } from "@/lib/gmail"
import { categorizeThreads } from "@/lib/claude"
import { classifyThreadsByEmbedding } from "@/lib/embeddings"
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const force = req.nextUrl.searchParams.get("force") === "true"

  try {
    const currentIds = await listThreadIds(session.accessToken, 40)

    const cacheData = force ? null : readCacheMap<CategorizedThread>(userEmail)
    let cached = cacheData ? { ...cacheData.emails } : {}

    // If every cached thread is "Other", the previous categorization run failed — clear it
    const cachedValues = Object.values(cached)
    if (cachedValues.length > 0 && cachedValues.every((t) => t.category === "Other")) {
      cached = {}
    }

    const newIds = currentIds.filter((id) => !cached[id])

    let categorizationError: string | undefined

    if (newIds.length > 0) {
      const newThreads = await fetchThreadsByIds(session.accessToken, newIds)
      const existingCategories = [...new Set(Object.values(cached).map((t) => t.category))]
      try {
        // Pre-classify by embedding similarity — avoids Claude for threads that look like
        // ones we've already categorized. Falls back silently if Voyage isn't configured.
        const cachedThreadsList = Object.values(cached) as CategorizedThread[]
        const { certain: bySimilarity, uncertain: toClassify } = await classifyThreadsByEmbedding(
          userEmail,
          newThreads,
          cachedThreadsList
        )
        for (const thread of bySimilarity) {
          cached[thread.id] = thread
        }

        if (toClassify.length > 0) {
          const categorized = await categorizeThreads(apiKey, toClassify, existingCategories)
          for (const thread of categorized) {
            cached[thread.id] = thread
          }
        }

        writeCacheMap<CategorizedThread>(userEmail, cached)
      } catch (err: any) {
        categorizationError = err?.message || String(err)
        console.error("[/api/emails] categorization failed:", categorizationError)
      }
    }

    const threads = currentIds.map((id) => cached[id]).filter(Boolean)
    const updatedAt = newIds.length === 0 && cacheData ? cacheData.updatedAt : new Date().toISOString()

    return NextResponse.json({ threads, cachedAt: updatedAt, newCount: newIds.length, categorizationError })
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
