"use client"

import { useEffect, useState } from "react"
import { CategorizedThread, Email } from "@/types"
import ComposePanel from "@/components/ComposePanel"
import { useResizableSidebar } from "@/lib/useResizableSidebar"

const COLOR_POOL = [
  "bg-blue-100 text-blue-700",
  "bg-sky-100 text-sky-700",
  "bg-cyan-100 text-cyan-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-slate-100 text-slate-600",
]

const DOT_COLOR_POOL = [
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-slate-400",
]

// Per-thread avatar background / text pairs — enough variety to look distinct
const AVATAR_COLOR_POOL = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-sky-100 text-sky-700",
  "bg-pink-100 text-pink-700",
  "bg-lime-100 text-lime-700",
]

const SUMMARY_OPTIONS = [
  { label: "Latest", count: 1, title: "Summarize the most recent message in this conversation" },
  { label: "Last 5", count: 5, title: "Summarize the last 5 messages in this conversation" },
  { label: "Last 10", count: 10, title: "Summarize the last 10 messages in this conversation" },
  { label: "All", count: "all" as const, title: "Summarize every message in this conversation" },
]

function categoryColor(category: string, allCategories: string[]) {
  const i = allCategories.indexOf(category)
  return COLOR_POOL[i % COLOR_POOL.length] ?? "bg-slate-100 text-slate-600"
}

function categoryDotColor(category: string, allCategories: string[]) {
  const i = allCategories.indexOf(category)
  return DOT_COLOR_POOL[i % DOT_COLOR_POOL.length] ?? "bg-slate-400"
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

function getInitials(name: string) {
  const cleaned = name.replace(/<.*>/, "").trim().replace(/^(the|a|an)\s+/i, "")
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
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
  const [activeSummaryCount, setActiveSummaryCount] = useState<Record<string, number | "all">>({})
  const [activeReplyScope, setActiveReplyScope] = useState<Record<string, string>>({})
  const [compose, setCompose] = useState<
    | { mode: "reply"; threadId: string; scope: string; category?: string }
    | { mode: "new"; category?: string }
    | null
  >(null)

  // In-place AI search within current category
  const [categoryQuery, setCategoryQuery] = useState("")
  const [categorySearchResult, setCategorySearchResult] = useState("")
  const [categorySearchLoading, setCategorySearchLoading] = useState(false)

  // Sent folder
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox")
  const [sentEmails, setSentEmails] = useState<Email[]>([])
  const [sentLoading, setSentLoading] = useState(false)

  // Category rename
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

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
        let msg = res.status === 401 ? "session-expired" : "Failed to load emails"
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

  function setFilterAndReset(cat: string) {
    setFilter(cat)
    setCategoryQuery("")
    setCategorySearchResult("")
  }

  async function renameCategory(oldName: string) {
    const newName = editValue.trim()
    setEditingCategory(null)
    if (!newName || newName === oldName) return
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      })
      if (!res.ok) throw new Error(await res.text())
      setThreads((prev) => prev.map((t) => (t.category === oldName ? { ...t, category: newName } : t)))
      if (filter === oldName) setFilter(newName)
    } catch {
      // leave category as-is on failure
    }
  }

  async function handleCategorySearch(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryQuery.trim()) return
    setCategorySearchLoading(true)
    setCategorySearchResult("")
    try {
      const res = await fetch("/api/category-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: filter, query: categoryQuery }),
      })
      if (!res.ok) {
        const body = await res.text()
        let msg = "Search failed"
        try { msg = JSON.parse(body).error ?? msg } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      setCategorySearchResult(data.summary)
    } catch (e: any) {
      setCategorySearchResult(`Error: ${e.message}`)
    } finally {
      setCategorySearchLoading(false)
    }
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
      const cleanSummary = (data.summary as string).replace(/^##\s+[^\n]+\n+/, '').trim()
      setSummaries((prev) => ({ ...prev, [key]: cleanSummary }))
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
  const { width: sidebarWidth, startResize } = useResizableSidebar("sidebar-width", 208)

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Sidebar */}
      <aside className="relative shrink-0 border-r border-primary-200 bg-primary-100" style={{ width: sidebarWidth }}>
        <div
          onMouseDown={startResize}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-300 active:bg-primary-400 transition-colors z-10"
        />
        <div className="sticky top-16 p-4 flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-slate-900">
              {folder === "sent" ? "Sent" : "Inbox"}
            </h1>
            {folder === "inbox" && (
              <button
                onClick={() => loadThreads(true)}
                disabled={loading}
                className="text-xs text-primary-600 hover:text-primary-800 disabled:opacity-40 transition-colors"
              >
                {loading ? "…" : "Refresh"}
              </button>
            )}
          </div>

          {folder === "inbox" && cachedAt && !loading && (
            <p className="text-xs text-slate-400 mb-3">
              {newCount > 0 ? (
                <>
                  <span className="text-coral-500 font-medium">{newCount} new</span> · updated {timeAgo(cachedAt)}
                </>
              ) : (
                `Updated ${timeAgo(cachedAt)}`
              )}
            </p>
          )}

          {error && folder === "inbox" && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {error === "session-expired" || error.toLowerCase().includes("session expired") ? (
                <>Your Google session expired.{" "}
                  <a href="/api/auth/signout" className="underline font-medium">Sign out and sign back in</a>
                  {" "}to continue.
                </>
              ) : error}
            </div>
          )}

          {/* Compose */}
          <button
            onClick={() => setCompose({ mode: "new", category: filter !== "All" ? filter : undefined })}
            className="w-full mb-3 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-full transition-colors flex items-center justify-center gap-1.5"
          >
            <span>✏️</span> Compose
          </button>

          {/* Category list — inbox only */}
          {folder === "inbox" && (
            <nav className="space-y-0.5 flex-1 overflow-y-auto">
              {(["All", ...uniqueCategories] as string[]).map((cat) =>
                editingCategory === cat ? (
                  <input
                    key={cat}
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => renameCategory(cat)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameCategory(cat)
                      if (e.key === "Escape") setEditingCategory(null)
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-primary-300 text-slate-900 outline-none"
                  />
                ) : (
                  <button
                    key={cat}
                    onClick={() => setFilterAndReset(cat)}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      filter === cat
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-slate-600 hover:bg-primary-50 hover:text-primary-700"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {cat !== "All" && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${categoryDotColor(cat, uniqueCategories)}`} />
                      )}
                      <span className="truncate">{cat}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {cat !== "All" && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setEditValue(cat) }}
                          title="Rename category"
                          className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-primary-600 transition-opacity"
                        >
                          ✏️
                        </span>
                      )}
                      <span className={`text-xs ${filter === cat ? "text-primary-500" : "text-slate-400"}`}>
                        {cat === "All" ? threads.length : counts[cat]}
                      </span>
                    </span>
                  </button>
                )
              )}
            </nav>
          )}

          {/* Sent button */}
          <div className="mt-auto pt-3 border-t border-slate-100">
            <button
              onClick={() => switchFolder(folder === "sent" ? "inbox" : "sent")}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                folder === "sent"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-slate-600 hover:bg-primary-50 hover:text-primary-700"
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

        {/* In-place AI search */}
        {folder === "inbox" && threads.length > 0 && (
          <div className="mb-4">
            <form onSubmit={handleCategorySearch} className="flex gap-2">
              <input
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder={`✦ Ask AI about your ${filter === "All" ? "inbox" : filter} emails…`}
                className="flex-1 px-4 py-2.5 bg-white border border-primary-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={categorySearchLoading || !categoryQuery.trim()}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-medium rounded-full transition-colors"
              >
                {categorySearchLoading ? "…" : "Ask"}
              </button>
            </form>

            {categorySearchResult && (
              <div className="mt-3 bg-white border border-primary-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-coral-500">✦</span>
                    <h2 className="font-semibold text-primary-900 text-sm">AI Search</h2>
                  </div>
                  <button
                    onClick={() => setCategorySearchResult("")}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{categorySearchResult}</p>
              </div>
            )}
          </div>
        )}

        {/* Inbox thread list */}
        {folder === "inbox" && (
          <div className="space-y-1.5">
            {filtered.map((thread) => {
              const isExpanded = expandedId === thread.id
              const threadIndex = threads.indexOf(thread)
              const avatarColor = AVATAR_COLOR_POOL[threadIndex % AVATAR_COLOR_POOL.length] ?? "bg-primary-100 text-primary-700"
              return (
                <div
                  key={thread.id}
                  className={`bg-white rounded-xl border transition-shadow ${
                    !thread.isRead ? "border-primary-200" : "border-slate-200"
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
                          ? <div className="w-2 h-2 rounded-full bg-coral-500" />
                          : <div className="w-2 h-2" />}
                      </div>

                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${avatarColor}`}>
                        {getInitials(thread.participants[0] ?? "?")}
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
                        <div className={`text-base truncate ${!thread.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                          {thread.subject}
                        </div>

                        {/* One-liner summary — AI-generated at fetch time, falls back to Gmail snippet */}
                        {(thread.oneLiner || thread.snippet) && (
                          <div className="text-xs text-slate-400 truncate mt-0.5">{thread.oneLiner || thread.snippet}</div>
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
                        <span className="text-xs font-medium text-slate-600 mr-1" title="Summarize messages within this conversation">✦ Summarize</span>
                        {SUMMARY_OPTIONS.map(({ label, count, title }) => {
                          const key = `${thread.id}-${count}`
                          const isLoading = summaryLoading === key
                          const isActive = activeSummaryCount[thread.id] === count
                          return (
                            <button
                              key={label}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isActive) {
                                  // deselect
                                  setActiveSummaryCount((prev) => { const next = { ...prev }; delete next[thread.id]; return next })
                                } else {
                                  setActiveSummaryCount((prev) => ({ ...prev, [thread.id]: count }))
                                  handleSummarize(thread.id, count)
                                }
                              }}
                              disabled={isLoading}
                              title={title}
                              className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors disabled:opacity-40 ${
                                isActive
                                  ? "bg-primary-600 text-white border-primary-600"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              {isLoading ? "…" : label}
                            </button>
                          )
                        })}
                        <span className="text-slate-200 mx-1">|</span>
                        <span className="text-xs font-medium text-slate-600 mr-1" title="Generate an AI reply draft, then edit and send">Draft reply</span>
                        {([
                          { label: 'Latest',       scope: 'latest', title: 'AI draft based only on the most recent message' },
                          { label: 'Full history', scope: 'full',   title: 'AI draft based on the entire conversation history' },
                          { label: 'Manual',       scope: 'none',   title: 'Start with a blank reply — write it yourself' },
                        ] as const).map(({ label, scope, title }) => {
                          const isActive = activeReplyScope[thread.id] === scope && compose?.mode === 'reply' && compose.threadId === thread.id
                          return (
                            <button
                              key={scope}
                              title={title}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isActive) {
                                  // deselect — close compose
                                  setActiveReplyScope((prev) => { const next = { ...prev }; delete next[thread.id]; return next })
                                  setCompose(null)
                                } else {
                                  setActiveReplyScope((prev) => ({ ...prev, [thread.id]: scope }))
                                  setCompose({ mode: 'reply', threadId: thread.id, scope, category: thread.category })
                                }
                              }}
                              className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
                                isActive
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Summary output */}
                      {(() => {
                        const activeCount = activeSummaryCount[thread.id]
                        const activeSummary = activeCount !== undefined ? SUMMARY_OPTIONS.find(({ count }) => count === activeCount) : undefined
                        if (!activeSummary || !summaries[`${thread.id}-${activeSummary.count}`]) return null
                        const key = `${thread.id}-${activeSummary.count}`
                        const labelMap: Record<string, string> = {
                          Latest: 'Latest message',
                          'Last 5': 'Last 5 messages',
                          'Last 10': 'Last 10 messages',
                          All: 'All messages',
                        }
                        return (
                          <div key={key} className="mx-5 my-3 rounded-xl bg-primary-50 border border-primary-200 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-primary-200 bg-primary-100/60">
                              <div className="flex items-center gap-1.5">
                                <span className="text-coral-500 text-xs">✦</span>
                                <span className="text-xs font-semibold text-primary-800">Summary</span>
                                <span className="text-xs text-primary-500">·</span>
                                <span className="text-xs text-primary-600 font-medium">{labelMap[activeSummary.label] ?? activeSummary.label}</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSummaries((prev) => { const next = { ...prev }; delete next[key]; return next }); setActiveSummaryCount((prev) => { const next = { ...prev }; delete next[thread.id]; return next }) }}
                                className="text-xs text-primary-400 hover:text-primary-700 transition-colors"
                                title="Dismiss summary"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="px-4 py-3 text-sm text-slate-700 leading-relaxed">{summaries[key]}</p>
                          </div>
                        )
                      })()}

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
          <div>
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
          threadId={compose.mode === "reply" ? compose.threadId : undefined}
          thread={compose.mode === "reply" ? threads.find((t) => t.id === compose.threadId) : undefined}
          scope={compose.mode === "reply" && compose.scope !== "none" ? compose.scope : undefined}
          autoDraft={compose.mode === "reply" && compose.scope !== "none"}
          categories={uniqueCategories}
          defaultCategory={compose.category}
          onClose={() => { setCompose(null); setActiveReplyScope((prev) => { if (compose?.mode !== 'reply') return prev; const next = { ...prev }; delete next[compose.threadId]; return next }) }}
          onSent={() => { setCompose(null); setActiveReplyScope({}) }}
        />
      )}
    </div>
  )
}
