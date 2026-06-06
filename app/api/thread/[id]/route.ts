import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getThread } from "@/lib/gmail"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params
  const thread = await getThread(session.accessToken, id)
  return NextResponse.json({ thread })
}
