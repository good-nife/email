import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getThread, getSentEmails } from "@/lib/gmail"
import { draftReply, draftNewEmail } from "@/lib/claude"
import { readThreadCache } from "@/lib/cache"
import { getCachedResponse, responseCacheKey, setCachedResponse } from "@/lib/response-cache"
import { trackUsage } from "@/lib/user"
import { CategorizedThread } from "@/types"

const DRAFT_CACHE_PREFIX = "drafts"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const body = await req.json()
  const { threadId, to, subject, context, scope, category, signature } = body
  const userEmail = session.user?.email ?? "unknown"

  const [sentEmails] = await Promise.all([getSentEmails(session.accessToken, 15)])

  let categoryThreads: CategorizedThread[] = []
  if (category) {
    const cacheData = await readThreadCache(userEmail)
    if (cacheData) {
      categoryThreads = Object.values(cacheData.emails).filter((t) => t.category === category)
    }
  }

  let draft: string

  if (threadId) {
    let thread = await getThread(session.accessToken, threadId)
    if (scope === "latest") {
      thread = { ...thread, messages: thread.messages.slice(-1) }
    }

    const cacheKey = responseCacheKey([
      "reply",
      threadId,
      scope ?? "full",
      category ?? "",
      context ?? "",
      signature ?? "",
      thread.messageCount,
    ])
    const cached = await getCachedResponse(userEmail, DRAFT_CACHE_PREFIX, cacheKey)
    if (cached) {
      return NextResponse.json({ draft: cached })
    }

    draft = await draftReply(apiKey, thread, sentEmails, categoryThreads, context ?? "", scope === "latest" ? "latest" : "full", signature ?? "")
    await setCachedResponse(userEmail, DRAFT_CACHE_PREFIX, cacheKey, draft)
    void trackUsage(userEmail, "draft")
  } else {
    draft = await draftNewEmail(apiKey, to, subject, context ?? "", sentEmails, categoryThreads, signature ?? "")
    void trackUsage(userEmail, "draft")
  }

  return NextResponse.json({ draft })
}
