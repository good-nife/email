import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { readThreadCache, writeThreadCache } from "@/lib/cache"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { oldName, newName } = await req.json()
  if (!oldName?.trim() || !newName?.trim()) {
    return NextResponse.json({ error: "oldName and newName are required" }, { status: 400 })
  }

  const userEmail = session.user?.email ?? "unknown"
  const cacheData = await readThreadCache(userEmail)
  if (!cacheData) {
    return NextResponse.json({ error: "No cached emails yet" }, { status: 400 })
  }

  const trimmed = newName.trim()
  const updated = { ...cacheData.emails }
  for (const [id, thread] of Object.entries(updated)) {
    if (thread.category === oldName) {
      updated[id] = { ...thread, category: trimmed }
    }
  }
  await writeThreadCache(userEmail, updated)

  return NextResponse.json({ ok: true })
}
