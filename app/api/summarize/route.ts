import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getThread } from "@/lib/gmail"
import { summarizeThread } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on server" }, { status: 500 })
  }

  const { threadId, count } = await req.json()
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 })
  }

  const thread = await getThread(session.accessToken, threadId)
  const messageCount: number | "all" = count === "all" ? "all" : Number(count)
  const summary = await summarizeThread(apiKey, thread, messageCount)

  return NextResponse.json({ summary })
}
