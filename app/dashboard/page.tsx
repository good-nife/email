"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CategorizedEmail } from "@/types"

const COLOR_POOL = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-yellow-100 text-yellow-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-red-100 text-red-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
]

function categoryColor(category: string, allCategories: string[]) {
  const i = allCategories.indexOf(category)
  return COLOR_POOL[i % COLOR_POOL.length] ?? "bg-slate-100 text-slate-600"
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function DashboardPage() {
  const [emails, setEmails] = useState<CategorizedEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("All")
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadEmails(false)
  }, [])

  async function loadEmails(force: boolean) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/emails${force ? "?force=true" : ""}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setEmails(data.emails)
      setCachedAt(data.cachedAt ?? null)
    } catch (e: any) {
      setError(e.message || "Failed to load emails")
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === "All" ? emails : emails.filter((e) => e.category === filter)

  const counts = emails.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  const uniqueCategories = [...new Set(emails.map((e) => e.category))]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          {cachedAt && !loading && (
            <p className="text-xs text-slate-400 mt-0.5">Updated {timeAgo(cachedAt)}</p>
          )}
        </div>
        <button
          onClick={() => loadEmails(true)}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Category filter tabs */}
      {emails.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(["All", ...uniqueCategories] as string[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {cat}
              <span className="ml-1 opacity-70">
                {cat === "All" ? emails.length : counts[cat]}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-3xl mb-3">⏳</div>
          <p>Loading and categorizing your emails…</p>
          <p className="text-sm mt-1">This takes about 10 seconds</p>
        </div>
      )}

      {!loading && !error && emails.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-3xl mb-3">📭</div>
          <p>No emails found.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((email) => (
          <div
            key={email.id}
            className={`bg-white rounded-xl border px-5 py-4 hover:shadow-sm transition-shadow cursor-pointer ${
              !email.isRead ? "border-blue-200 bg-blue-50/30" : "border-slate-200"
            }`}
            onClick={() => router.push(`/compose?mode=reply&threadId=${email.threadId}`)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium text-sm truncate ${!email.isRead ? "text-slate-900" : "text-slate-700"}`}>
                    {email.from}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColor(email.category, uniqueCategories)}`}>
                    {email.category}
                  </span>
                </div>
                <div className={`text-sm truncate mb-1 ${!email.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                  {email.subject}
                </div>
                <div className="text-xs text-slate-400 truncate">{email.snippet}</div>
              </div>
              <div className="text-xs text-slate-400 shrink-0 mt-0.5">{formatDate(email.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
