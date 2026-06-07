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

const SUMMARY_OPTIONS = [
  { label: "Latest", count: 1 },
  { label: "Last 5", count: 5 },
  { label: "Last 10", count: 10 },
  { label: "All", count: "all" as const },
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null)
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

  async function handleSummarize(emailId: string, threadId: string, count: number | "all") {
    const key = `${emailId}-${count}`
    if (summaries[key]) return // already loaded
    setSummaryLoading(key)
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, count }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSummaries((prev) => ({ ...prev, [key]: data.summary }))
    } catch (e: any) {
      setSummaries((prev) => ({ ...prev, [key]: `Error: ${e.message}` }))
    } finally {
      setSummaryLoading(null)
    }
  }

  const filtered = filter === "All" ? emails : emails.filter((e) => e.category === filter)

  const counts = emails.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  const uniqueCategories = [...new Set(emails.map((e) => e.category))]

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Left sidebar */}
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-white">
        <div className="sticky top-16 p-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-slate-900">Inbox</h1>
            <button
              onClick={() => loadEmails(true)}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>
          {cachedAt && !loading && (
            <p className="text-xs text-slate-400 mb-4">Updated {timeAgo(cachedAt)}</p>
          )}

          {error && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {error}
            </div>
          )}

          {/* Category list */}
          <nav className="space-y-0.5">
            {(["All", ...uniqueCategories] as string[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  filter === cat
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{cat}</span>
                <span className={`text-xs ml-1 shrink-0 ${filter === cat ? "text-blue-500" : "text-slate-400"}`}>
                  {cat === "All" ? emails.length : counts[cat]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main email list */}
      <main className="flex-1 min-w-0 px-6 py-6">
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

        <div className="space-y-2 max-w-3xl">
        {filtered.map((email) => {
          const isExpanded = expandedId === email.id
          return (
            <div
              key={email.id}
              className={`bg-white rounded-xl border transition-shadow ${
                !email.isRead ? "border-blue-200 bg-blue-50/30" : "border-slate-200"
              } ${isExpanded ? "shadow-sm" : ""}`}
            >
              {/* Card header — click to expand */}
              <div
                className="px-5 py-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : email.id)}
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
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-xs text-slate-400">{formatDate(email.date)}</div>
                    <div className={`text-slate-300 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</div>
                  </div>
                </div>
              </div>

              {/* Action panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  {/* Summarize */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summarize</p>
                    <div className="flex gap-2 flex-wrap">
                      {SUMMARY_OPTIONS.map(({ label, count }) => {
                        const key = `${email.id}-${count}`
                        const isLoading = summaryLoading === key
                        const hasSummary = !!summaries[key]
                        return (
                          <button
                            key={label}
                            onClick={() => handleSummarize(email.id, email.threadId, count)}
                            disabled={isLoading}
                            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors disabled:opacity-40 ${
                              hasSummary
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            {isLoading ? "…" : label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Show whichever summary was most recently loaded */}
                    {SUMMARY_OPTIONS.map(({ count }) => {
                      const key = `${email.id}-${count}`
                      return summaries[key] ? (
                        <div key={key} className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed">
                          {summaries[key]}
                        </div>
                      ) : null
                    }).filter(Boolean).slice(-1)}
                  </div>

                  {/* Draft reply */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Draft Reply</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/compose?mode=reply&threadId=${email.threadId}&scope=latest`)}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-white text-slate-600 border-slate-200 hover:border-slate-400 font-medium transition-colors"
                      >
                        Based on latest
                      </button>
                      <button
                        onClick={() => router.push(`/compose?mode=reply&threadId=${email.threadId}&scope=full`)}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-white text-slate-600 border-slate-200 hover:border-slate-400 font-medium transition-colors"
                      >
                        Based on full history
                      </button>
                      <button
                        onClick={() => router.push(`/compose?mode=reply&threadId=${email.threadId}`)}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-white text-slate-600 border-slate-200 hover:border-slate-400 font-medium transition-colors"
                      >
                        Write manually
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </main>
    </div>
  )
}
