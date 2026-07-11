import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { searchCategoryThreads } from "@/lib/claude"
import { rankThreadsByRelevance } from "@/lib/embeddings"
import { getOrCreateUser, trackUsage, UsageOptions } from "@/lib/user"
import { CategorizedThread } from "@/types"

const TOP_K_THREADS = 15

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const { category, query, threads: clientThreads } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  if (!clientThreads?.length) {
    return NextResponse.json({ error: "No cached emails yet — load your inbox first." }, { status: 400 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const { id: userId } = await getOrCreateUser(userEmail)
  const threads = (clientThreads as CategorizedThread[]).filter(
    (t) => !category || category === "All" || t.category === category
  )

  if (threads.length === 0) {
    return NextResponse.json({ summary: "No emails found in this category." })
  }

  const embeddingOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "search-embedding", opts)
  const { threads: relevantThreads, ranked } = await rankThreadsByRelevance(
    userId, threads, query, TOP_K_THREADS, embeddingOnUsage
  )

  const searchOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "category-search", opts)
  const summary = await searchCategoryThreads(apiKey, relevantThreads, query, ranked, searchOnUsage)
  return NextResponse.json({ summary })
}
