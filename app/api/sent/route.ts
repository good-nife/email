import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getSentEmails } from "@/lib/gmail"

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const emails = await getSentEmails(session.accessToken, 30)
    return NextResponse.json({ emails })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load sent emails" }, { status: 500 })
  }
}
