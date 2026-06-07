"use client"

import { useEffect, useState } from "react"
import { CategorizedThread, Email } from "@/types"
import ComposePanel from "@/components/ComposePanel"

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
  if (d.toDateString() === now.toDateString()) {
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

function participantDisplay(participants: string[]) {
  if (participants.length <= 2) return participants.join(", ")
  return `${participants.slice(0, 2).join(", ")} +${participants.length - 2}`
}

export default function DashboardPage() {
  const [threads, setThreads] = useState<CategorizedThread[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("All")
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null)
  const [compose, setCompose] = useState<{ threadId: string; scope: string } | null>(null)

  // Sent folder
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox")
  const [sentEmails, setSentEmails] = useState<Email[]>([])
  const [sentLoading, setSentLoading] = useState(false)

  useEffect(() => {
    loadThreads(false)

    const poll = setInterval(() => {
      if (!document.hidden) loadThreads(false, true)
    }, 30_000)

    return () => clearInterval(poll)
  }, [])

  async function loadThreads(force: boolean, silent = false) {
    if (!silent) setLoading(true)
    if (!silent) setError("")
    try {
      const res = await fetch(`/api/emails${force ? "?force=true" : ""}`)
      if (!res.ok) {
        const body = await res.text()
        let msg = "Failed to load emails"
        try { msg = JSON.parse(body).error ?? msg } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      setThreads(data.threads ?? [])
      setCachedAt(data.cachedAt ?? null)
      setNewCount(data.newCount ?? 0)
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load emails")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function loadSent() {
    setSentLoading(true)
    try {
      const res = await fetch("/api/sent")
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSentEmails(data.emails ?? [])
    } catch {
      // silent
    } finally {
      setSentLoading(false)
    }
  }

  function switchFolder(f: "inbox" | "sent") {
    setFolder(f)
    setExpandedId(null)
    if (f === "sent" && sentEmails.length === 0) loadSent()
  }

  async function handleSummarize(threadId: string, count: number | "all") {
    const key = `${threadId}-${count}`
    if (summaries[key]) return
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

  const filtered = filter === "All" ? threads : threads.filter((t) => t.category === filter)
  const counts = threads.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})
  const uniqueCategories = [...new Set(threads.map((t) => t.category))]

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-white">
        <div className="sticky top-16 p-4 flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-slate-900">
              {folder === "sent" ? "Sent" : "Inbox"}
            </h1>
            {folder === "inbox" && (
              <button
                onClick={() => loadThreads(true)}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
              >
                {loading ? "…" : "Refresh"}
              </button>
            )}
          </div>

          {folder === "inbox" && cachedAt && !loading && (
            <p className="text-xs text-slate-400 mb-3">
              {newCount > 0 ? `${newCount} new · updated ${timeAgo(cachedAt)}` : `Updated ${timeAgo(cachedAt)}`}
            </p>
          )}

          {error && folder === "inbox" && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {error}
            </div>
          )}

          {/* Category list — inbox only */}
          {folder === "inbox" && (
            <nav className="space-y-0.5 flex-1 overflow-y-auto">
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
                    {cat === "All" ? threads.length : counts[cat]}
                  </span>
                </button>
              ))}
            </nav>
          )}

          {/* Sent button */}
          <div className="mt-auto pt-3 border-t border-slate-100">
            <button
              onClick={() => switchFolder(folder === "sent" ? "inbox" : "sent")}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                folder === "sent"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {folder === "sent" ? "← Inbox" : "Sent"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 px-6 py-6">
        {loading && threads.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3">⏳</div>
            <p>Loading and categorizing your conversations…</p>
            <p className="text-sm mt-1">First load takes about 15 seconds</p>
          </div>
        )}

        {/* Inbox thread list */}
        {folder === "inbox" && (
          <div className="space-y-1.5 max-w-3xl">
            {filtered.map((thread) => {
              const isExpanded = expandedId === thread.id
              return (
                <div
                  key={thread.id}
                  className={`bg-white rounded-xl border transition-shadow ${
                    !thread.isRead ? "border-blue-200" : "border-slate-200"
                  } ${isExpanded ? "shadow-sm" : ""}`}
                >
                  {/* Thread header */}
                  <div
                    className="px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : thread.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-1.5 shrink-0">
                        {!thread.isRead
                          ? <div className="w-2 h-2 rounded-full bg-blue-500" />
                          : <div className="w-2 h-2" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Participants + badges */}
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm truncate ${!thread.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                            {participantDisplay(thread.participants)}
                          </span>
                          {thread.messageCount > 1 && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                              {thread.messageCount}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColor(thread.category, uniqueCategories)}`}>
                            {thread.category}
                          </span>
                        </div>

                        {/* Subject */}
                        <div className={`text-sm truncate ${!thread.isRead ? "font-medium text-slate-900" : "text-slate-600"}`}>
                          {thread.subject}
                        </div>

                        {/* Snippet */}
                        {!isExpanded && (
                          <div className="text-xs text-slate-400 truncate mt-0.5">{thread.snippet}</div>
                        )}

                        {/* Tags */}
                        {thread.tags?.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1.5">
                            {thread.tags.map((tag) => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs text-slate-400">{formatDate(thread.lastDate)}</span>
                        <span className={`text-slate-300 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      {/* Action controls */}
                      <div className="px-5 py-2.5 flex items-center gap-1 flex-wrap border-b border-slate-100 bg-slate-50/60">
                        <span className="text-xs text-slate-400 mr-1">Summarize</span>
                        {SUMMARY_OPTIONS.map(({ label, count }) => {
                          const key = `${thread.id}-${count}`
                          const isLoading = summaryLoading === key
                          const hasSummary = !!summaries[key]
                          return (
                            <button
                              key={label}
                              onClick={(e) => { e.stopPropagation(); handleSummarize(thread.id, count) }}
                              disabled={isLoading}
                              className={`px-2 py-1 text-xs rounded border font-medium transition-colors disabled:opacity-40 ${
                                hasSummary
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              {isLoading ? "…" : label}
                            </button>
                          )
                        })}
                        <span className="text-slate-200 mx-1">|</span>
                        <span className="text-xs text-slate-400 mr-1">Reply</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCompose({ threadId: thread.id, scope: "latest" }) }}
                          className="px-2 py-1 text-xs rounded border bg-white text-slate-500 border-slate-200 hover:border-slate-400 font-medium transition-colors"
                        >
                          Latest
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCompose({ threadId: thread.id, scope: "full" }) }}
                          className="px-2 py-1 text-xs rounded border bg-white text-slate-500 border-slate-200 hover:border-slate-400 font-medium transition-colors"
                        >
                          Full history
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCompose({ threadId: thread.id, scope: "none" }) }}
                          className="px-2 py-1 text-xs rounded border bg-white text-slate-500 border-slate-200 hover:border-slate-400 font-medium transition-colors"
                        >
                          Manual
                        </button>
                      </div>

                      {/* Summary output */}
                      {SUMMARY_OPTIONS.map(({ count }) => {
                        const key = `${thread.id}-${count}`
                        return summaries[key] ? (
                          <div key={key} className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-sm text-slate-700 leading-relaxed">
                            {summaries[key]}
                          </div>
                        ) : null
                      }).filter(Boolean).slice(-1)}

                      {/* Messages */}
                      <div className="divide-y divide-slate-50">
                        {thread.messages.map((msg) => (
                          <div key={msg.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-700">{msg.from}</span>
                              <span className="text-xs text-slate-400">{formatDate(msg.date)}</span>
                            </div>
                            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                              {msg.body || msg.snippet || "(no content)"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {!loading && filtered.length === 0 && threads.length > 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>No conversations in this category.</p>
              </div>
            )}
          </div>
        )}

        {/* Sent folder */}
        {folder === "sent" && (
          <div className="max-w-3xl">
            {sentLoading && (
              <div className="text-center py-20 text-slate-400">
                <div className="text-3xl mb-3">⏳</div>
                <p>Loading sent emails…</p>
              </div>
            )}
            <div className="space-y-1.5">
              {sentEmails.map((email) => (
                <div
                  key={email.id}
                  className={`bg-white rounded-xl border border-slate-200 cursor-pointer ${
                    expandedId === email.id ? "shadow-sm" : ""
                  }`}
                  onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                >
                  <div className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-400 mb-0.5">To: {email.fromEmail}</div>
                        <div className="text-sm font-medium text-slate-800 truncate">{email.subject}</div>
                        {expandedId !== email.id && (
                          <div className="text-xs text-slate-400 truncate mt-0.5">{email.snippet}</div>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs text-slate-400">{formatDate(email.date)}</span>
                        <span className={`text-slate-300 text-xs transition-transform ${expandedId === email.id ? "rotate-180" : ""}`}>▼</span>
                      </div>
                    </div>
                  </div>
                  {expandedId === email.id && (
                    <div className="border-t border-slate-100 px-5 py-4">
                      <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                        {email.body || email.snippet || "(no content)"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!sentLoading && sentEmails.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <div className="text-3xl mb-3">📤</div>
                  <p>No sent emails found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {compose && (
        <ComposePanel
          threadId={compose.threadId}
          scope={compose.scope === "none" ? undefined : compose.scope}
          onClose={() => setCompose(null)}
          onSent={() => setCompose(null)}
        />
      )}
    </div>
  )
}
