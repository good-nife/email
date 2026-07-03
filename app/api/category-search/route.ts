import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { searchCategoryThreads } from "@/lib/claude"
import { readCacheMap } from "@/lib/cache"
import { rankThreadsByRelevance } from "@/lib/embeddings"
import { getCachedResponse, responseCacheKey, setCachedResponse } from "@/lib/response-cache"
import { CategorizedThread } from "@/types"

const TOP_K_THREADS = 15
const RESPONSE_CACHE_PREFIX = "category-search"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const { category, query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const cacheData = readCacheMap<CategorizedThread>(userEmail)
  if (!cacheData) {
    return NextResponse.json({ error: "No cached emails yet — load your inbox first." }, { status: 400 })
  }

  const threads = Object.values(cacheData.emails).filter(
    (t) => !category || category === "All" || t.category === category
  )

  if (threads.length === 0) {
    return NextResponse.json({ summary: "No emails found in this category." })
  }

  const cacheKey = responseCacheKey([
    category ?? "",
    query,
    threads.map((t) => `${t.id}:${t.messageCount}`).sort().join(","),
  ])
  const cached = getCachedResponse(userEmail, RESPONSE_CACHE_PREFIX, cacheKey)
  if (cached) {
    return NextResponse.json({ summary: cached })
  }

  const { threads: relevantThreads, ranked } = await rankThreadsByRelevance(
    userEmail,
    threads,
    query,
    TOP_K_THREADS
  )

  const summary = await searchCategoryThreads(apiKey, relevantThreads, query, ranked)
  setCachedResponse(userEmail, RESPONSE_CACHE_PREFIX, cacheKey, summary)
  return NextResponse.json({ summary })
}
