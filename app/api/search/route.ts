import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { searchThreads } from "@/lib/gmail"
import { summarizeCorrespondence, translateToGmailQuery } from "@/lib/claude"
import { getCachedResponse, responseCacheKey, setCachedResponse } from "@/lib/response-cache"
import { trackUsage, UsageOptions } from "@/lib/user"

const CORRESPONDENCE_CACHE_PREFIX = "correspondence"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const { query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const translateOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "search-translate", opts)
  const gmailQuery = await translateToGmailQuery(apiKey, query, translateOnUsage)
  const threads = await searchThreads(session.accessToken, gmailQuery)

  if (!threads.length) {
    return NextResponse.json({ threads: [], summary: "No emails found matching that search.", gmailQuery })
  }
  const cacheKey = responseCacheKey([
    query,
    threads.map((t) => `${t.id}:${t.messageCount}`).sort().join(","),
  ])
  const cached = await getCachedResponse(userEmail, CORRESPONDENCE_CACHE_PREFIX, cacheKey)
  if (cached) {
    return NextResponse.json({ threads, summary: cached, gmailQuery })
  }

  const searchOnUsage = (opts: UsageOptions) => void trackUsage(userEmail, "search", opts)
  const summary = await summarizeCorrespondence(apiKey, threads, query, searchOnUsage)
  await setCachedResponse(userEmail, CORRESPONDENCE_CACHE_PREFIX, cacheKey, summary)
  return NextResponse.json({ threads, summary, gmailQuery })
}
