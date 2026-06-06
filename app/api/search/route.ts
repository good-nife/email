import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { searchThreads } from "@/lib/gmail"
import { summarizeCorrespondence } from "@/lib/claude"

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

  const threads = await searchThreads(session.accessToken, query)

  if (!threads.length) {
    return NextResponse.json({ threads: [], summary: "No emails found matching that search." })
  }

  const summary = await summarizeCorrespondence(apiKey, threads, query)
  return NextResponse.json({ threads, summary })
}
