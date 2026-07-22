import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
  const entries = await prisma.waitlist.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, createdAt: true },
  })
  return NextResponse.json({ entries })
}
