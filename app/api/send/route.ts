import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sendEmail } from "@/lib/gmail"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { to, subject, body, threadId } = await req.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "to, subject, and body are required" }, { status: 400 })
  }

  await sendEmail(session.accessToken, to, subject, body, threadId)
  return NextResponse.json({ success: true })
}
