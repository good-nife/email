import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getThread, getSentEmails } from "@/lib/gmail"
import { draftReply, draftNewEmail } from "@/lib/claude"
import { trackUsage, UsageOptions } from "@/lib/user"
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
  const { threadId, to, subject, context, scope, signature, categoryThreads } = body
  const userEmail = session.user?.email ?? "unknown"

  const sentEmails = await getSentEmails(session.accessToken, 15)
  const ctxThreads: CategorizedThread[] = categoryThreads ?? []

  let draft: string
  const onUsage = (opts: UsageOptions) => void trackUsage(userEmail, "draft", opts)

  if (threadId) {
    let thread = await getThread(session.accessToken, threadId)
    if (scope === "latest") {
      thread = { ...thread, messages: thread.messages.slice(-1) }
    }
    draft = await draftReply(
      apiKey, thread, sentEmails, ctxThreads, context ?? "",
      scope === "latest" ? "latest" : "full", signature ?? "", onUsage
    )
  } else {
    draft = await draftNewEmail(
      apiKey, to, subject, context ?? "", sentEmails, ctxThreads, signature ?? "", onUsage
    )
  }

  return NextResponse.json({ draft })
}
