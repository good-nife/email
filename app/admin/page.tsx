"use client"

import { useEffect, useState } from "react"

type Entry = { email: string; createdAt: string; signedUp: boolean }

export default function AdminPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [removing, setRemoving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/waitlist")
      if (res.status === 403) { setError("Not authorized."); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEntries(data.entries ?? [])
    } catch {
      setError("Failed to load.")
    } finally {
      setLoading(false)
    }
  }

  async function remove(email: string) {
    setRemoving(email)
    try {
      await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setEntries((prev) => prev.filter((e) => e.email !== email))
    } finally {
      setRemoving(null)
    }
  }

  useEffect(() => { load() }, [])

  const pending = entries.filter((e) => !e.signedUp)
  const active  = entries.filter((e) => e.signedUp)

  if (loading) return <div className="p-10 text-slate-400">Loading…</div>
  if (error)   return <div className="p-10 text-red-500">{error}</div>

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Waitlist</h1>
      <p className="text-sm text-slate-400 mb-8">{entries.length} total · {pending.length} pending · {active.length} signed up</p>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Pending — add as test users</h2>
          <div className="space-y-2">
            {pending.map((e) => (
              <Row key={e.email} entry={e} onRemove={remove} removing={removing === e.email} />
            ))}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Signed up ✓</h2>
          <div className="space-y-2">
            {active.map((e) => (
              <Row key={e.email} entry={e} onRemove={remove} removing={removing === e.email} />
            ))}
          </div>
        </section>
      )}

      {entries.length === 0 && (
        <p className="text-slate-400 text-sm">No signups yet.</p>
      )}
    </div>
  )
}

function Row({ entry, onRemove, removing }: { entry: Entry; onRemove: (e: string) => void; removing: boolean }) {
  const date = new Date(entry.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{entry.email}</p>
        <p className="text-xs text-slate-400 mt-0.5">{date}{entry.signedUp ? " · active" : ""}</p>
      </div>
      <button
        onClick={() => onRemove(entry.email)}
        disabled={removing}
        className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors px-2 py-1"
      >
        {removing ? "…" : "Remove"}
      </button>
    </div>
  )
}
