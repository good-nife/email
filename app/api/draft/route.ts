import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getThread, getSentEmails } from "@/lib/gmail"
import { draftReply, draftNewEmail } from "@/lib/claude"

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
  const { threadId, to, subject, context } = body

  const [sentEmails] = await Promise.all([getSentEmails(session.accessToken, 15)])

  let draft: string

  if (threadId) {
    const thread = await getThread(session.accessToken, threadId)
    draft = await draftReply(apiKey, thread, sentEmails)
  } else {
    draft = await draftNewEmail(apiKey, to, subject, context ?? "", sentEmails)
  }

  return NextResponse.json({ draft })
}
