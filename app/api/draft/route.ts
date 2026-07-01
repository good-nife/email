import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getThread, getSentEmails } from "@/lib/gmail"
import { draftReply, draftNewEmail } from "@/lib/claude"
import { readCacheMap } from "@/lib/cache"
import { CategorizedThread } from "@/types"

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

  const [sentEmails] = await Promise.all([getSentEmails(session.accessToken, 15)])

  let categoryThreads: CategorizedThread[] = []
  if (category) {
    const userEmail = session.user?.email ?? "unknown"
    const cacheData = readCacheMap<CategorizedThread>(userEmail)
    if (cacheData) {
      categoryThreads = Object.values(cacheData.emails).filter((t) => t.category === category)
    }
  }

  let draft: string

  if (threadId) {
    let thread = await getThread(session.accessToken, threadId)
    // "latest" scope: only use the last message for context
    if (scope === "latest") {
      thread = { ...thread, messages: thread.messages.slice(-1) }
    }
    draft = await draftReply(apiKey, thread, sentEmails, categoryThreads, context ?? "", scope === "latest" ? "latest" : "full", signature ?? "")
  } else {
    draft = await draftNewEmail(apiKey, to, subject, context ?? "", sentEmails, categoryThreads, signature ?? "")
  }

  return NextResponse.json({ draft })
}
