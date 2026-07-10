import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listThreadIds, fetchThreadsByIds } from "@/lib/gmail"
import { categorizeThreads } from "@/lib/claude"
import { classifyThreadsByEmbedding } from "@/lib/embeddings"
import { readThreadCache, writeThreadCache, clearThreadCache } from "@/lib/cache"
import { getOrCreateUser, trackUsage, UsageOptions } from "@/lib/user"
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

  void getOrCreateUser(userEmail)

  try {
    const currentIds = await listThreadIds(session.accessToken, 200)

    const cacheData = force ? null : await readThreadCache(userEmail)
    let cached: Record<string, CategorizedThread> = cacheData ? { ...cacheData.emails } : {}

    // If every cached thread is "Other", the previous categorization run failed — clear it
    const cachedValues = Object.values(cached)
    if (cachedValues.length > 0 && cachedValues.every((t) => t.category === "Other")) {
      await clearThreadCache(userEmail)
      cached = {}
    }

    const newIds = currentIds.filter((id) => !cached[id])

    let categorizationError: string | undefined

    if (newIds.length > 0) {
      const newThreads = await fetchThreadsByIds(session.accessToken, newIds)
      const existingCategories = [...new Set(Object.values(cached).map((t) => t.category))]
      try {
        const cachedThreadsList = Object.values(cached) as CategorizedThread[]
        const embeddingOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "classify-embedding", opts)
        const { certain: bySimilarity, uncertain: toClassify } = await classifyThreadsByEmbedding(
          userEmail,
          newThreads,
          cachedThreadsList,
          undefined,
          embeddingOnUsage
        )
        for (const thread of bySimilarity) {
          cached[thread.id] = thread
        }

        if (toClassify.length > 0) {
          const categorizeOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "categorize", opts)
          const categorized = await categorizeThreads(apiKey, toClassify, existingCategories, categorizeOnUsage)
          for (const thread of categorized) {
            cached[thread.id] = thread
          }
        }

        await writeThreadCache(userEmail, cached)
      } catch (err: any) {
        categorizationError = err?.message || String(err)
        console.error("[/api/emails] categorization failed:", categorizationError)
      }
    }

    const threads = currentIds.map((id) => cached[id]).filter(Boolean)
    const updatedAt = newIds.length === 0 && cacheData ? cacheData.updatedAt : new Date().toISOString()

    return NextResponse.json({ threads, cachedAt: updatedAt, newCount: newIds.length, categorizationError })
  } catch (err: any) {
    const msg = err?.message || String(err)
    console.error("[/api/emails]", msg)

    try {
      const cached = await readThreadCache(userEmail)
      if (cached && !force) {
        const threads = Object.values(cached.emails)
        return NextResponse.json({ threads, cachedAt: cached.updatedAt, newCount: 0 })
      }
    } catch (cacheErr: any) {
      console.error("[/api/emails] cache fallback also failed:", cacheErr?.message)
    }

    return NextResponse.json({ error: msg || "Failed to load emails" }, { status: 500 })
  }
}
