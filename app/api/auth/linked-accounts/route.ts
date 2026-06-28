import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { readLinkedAccounts, removeLinkedAccount } from "@/lib/linked-accounts"

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const primaryEmail = session.user?.email ?? "unknown"
  const accounts = readLinkedAccounts(primaryEmail).map(({ email, name, picture }) => ({
    email,
    name,
    picture,
  }))

  return NextResponse.json({ accounts })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ error: "email param required" }, { status: 400 })

  const primaryEmail = session.user?.email ?? "unknown"
  removeLinkedAccount(primaryEmail, email)

  return NextResponse.json({ ok: true })
}
