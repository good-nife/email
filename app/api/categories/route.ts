import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
