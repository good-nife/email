import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listThreadIds, fetchThreadsByIds } from "@/lib/gmail"
import { categorizeThreads } from "@/lib/claude"
import { classifyThreadsByEmbedding } from "@/lib/embeddings"
import { getOrCreateUser, trackUsage, UsageOptions } from "@/lib/user"
import { CategorizedThread } from "@/types"

export async function POST(req: NextRequest) {
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
  const user = await getOrCreateUser(userEmail)
  const userId = user.id

  const body = await req.json().catch(() => ({}))
  const {
    force = false,
    cachedThreadIds = [],
    cachedCategories = [],
  } = body as {
    force?: boolean
    cachedThreadIds?: string[]
    cachedCategories?: Array<{ id: string; category: string; tags: string[] }>
  }

  try {
    const currentIds = await listThreadIds(session.accessToken, 200)

    // If every cached thread is "Other", the prior categorization run failed — ignore the cache
    const allOther = cachedCategories.length > 0 && cachedCategories.every((t) => t.category === "Other")
    const useCache = !force && !allOther

    const cachedIdSet = new Set(useCache ? cachedThreadIds : [])
    const newIds = currentIds.filter((id) => !cachedIdSet.has(id))

    // Build minimal ref objects for embedding-based classification
    const cachedRef: CategorizedThread[] = (useCache ? cachedCategories : []).map(
      ({ id, category, tags }) => ({
        id, category, tags, subject: "", participants: [], snippet: "",
        lastDate: "", isRead: true, messageCount: 1, messages: [],
      })
    )

    const newThreads: CategorizedThread[] = []
    let categorizationError: string | undefined

    if (newIds.length > 0) {
      const fetchedThreads = await fetchThreadsByIds(session.accessToken, newIds)
      try {
        const embeddingOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "classify-embedding", opts)
        const { certain: bySimilarity, uncertain: toClassify } = await classifyThreadsByEmbedding(
          userId, fetchedThreads, cachedRef, undefined, embeddingOnUsage
        )
        newThreads.push(...bySimilarity)

        if (toClassify.length > 0) {
          const existingCategories = [...new Set(cachedRef.map((t) => t.category))]
          const categorizeOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "categorize", opts)
          const categorized = await categorizeThreads(apiKey, toClassify, existingCategories, categorizeOnUsage)
          newThreads.push(...categorized)
        }
      } catch (err: any) {
        categorizationError = err?.message || String(err)
        console.error("[/api/emails] categorization failed:", categorizationError)
        newThreads.push(
          ...fetchedThreads.map((thread) => ({
            ...thread,
            category: "Other",
            tags: [],
            oneLiner: undefined,
          }))
        )
      }
    }

    return NextResponse.json({
      newThreads,
      currentIds,
      newCount: newIds.length,
      cachedAt: new Date().toISOString(),
      userEmail,
      ...(categorizationError ? { categorizationError } : {}),
    })
  } catch (err: any) {
    const msg = err?.message || String(err)
    console.error("[/api/emails]", msg)
    return NextResponse.json({ error: msg || "Failed to load emails" }, { status: 500 })
  }
}
