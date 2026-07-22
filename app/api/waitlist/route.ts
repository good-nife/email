import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

function isAdmin(email?: string | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean)
  return admins.includes(email)
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  try {
    await prisma.waitlist.upsert({
      where: { email },
      update: {},
      create: { email },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const entries = await prisma.waitlist.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, createdAt: true },
  })
  const signedUpEmails = new Set(
    (await prisma.user.findMany({
      where: { email: { in: entries.map((e) => e.email) } },
      select: { email: true },
    })).map((u) => u.email)
  )
  return NextResponse.json({
    entries: entries.map((e) => ({ ...e, signedUp: signedUpEmails.has(e.email) })),
  })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })
  await prisma.waitlist.delete({ where: { email } })
  return NextResponse.json({ ok: true })
}
