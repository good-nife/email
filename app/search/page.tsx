"use client"

import { useState, useEffect } from "react"
import { Thread } from "@/types"
import { useResizableSidebar } from "@/lib/useResizableSidebar"

const HISTORY_KEY = "search_history"
const MAX_HISTORY = 20

interface HistoryEntry {
  id: string
  query: string
  gmailQuery: string
  summary: string
  threadCount: number
  timestamp: string
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

function getInitials(name: string) {
  const cleaned = name.replace(/<.*>/, "").trim().replace(/^(the|a|an)\s+/i, "")
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" })
}

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [threads, setThreads] = useState<Thread[]>([])
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)
  const [expandedThread, setExpandedThread] = useState<string | null>(null)
  const [gmailQuery, setGmailQuery] = useState("")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    await runSearch(query)
  }

  async function runSearch(q: string) {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    setError("")
    setSummary("")
    setThreads([])
    setSearched(false)
    setGmailQuery("")
    setActiveHistoryId(null)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setThreads(data.threads)
      setSummary(data.summary)
      setGmailQuery(data.gmailQuery ?? "")
      setSearched(true)

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        query: q,
        gmailQuery: data.gmailQuery ?? "",
        summary: data.summary,
        threadCount: data.threads.length,
        timestamp: new Date().toISOString(),
      }
      const updated = [entry, ...loadHistory().filter((h) => h.query !== q)]
      saveHistory(updated)
      setHistory(updated)
      setActiveHistoryId(entry.id)
    } catch (e: any) {
      setError(e.message || "Search failed")
    } finally {
      setLoading(false)
    }
  }

  function loadFromHistory(entry: HistoryEntry) {
    setQuery(entry.query)
    setSummary(entry.summary)
    setGmailQuery(entry.gmailQuery)
    setThreads([])
    setSearched(true)
    setActiveHistoryId(entry.id)
    setError("")
  }

  function clearHistory() {
    saveHistory([])
    setHistory([])
    setActiveHistoryId(null)
  }

  const { width: sidebarWidth, startResize } = useResizableSidebar("sidebar-width", 256)

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Left sidebar — search history */}
      <aside className="relative shrink-0 border-r border-primary-200 bg-primary-100" style={{ width: sidebarWidth }}>
        <div
          onMouseDown={startResize}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-300 active:bg-primary-400 transition-colors z-10"
        />
        <div className="sticky top-16 p-4 flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Recent Searches</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400">Your searches will appear here.</p>
          ) : (
            <nav className="space-y-0.5 overflow-y-auto flex-1">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => loadFromHistory(entry)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    activeHistoryId === entry.id
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-primary-50 text-slate-700"
                  }`}
                >
                  <div className="text-sm font-medium truncate">{entry.query}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{entry.threadCount} thread{entry.threadCount !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>{timeAgo(entry.timestamp)}</span>
                  </div>
                </button>
              ))}
            </nav>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Find Correspondence</h1>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'John Smith', 'invoices from last year', 'emails about hiring contractors'"
            className="flex-1 px-4 py-3 bg-white border border-primary-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-medium rounded-full transition-colors"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-3">🔍</div>
            <p>Searching your emails and building a summary…</p>
          </div>
        )}

        {searched && !loading && gmailQuery && (
          <p className="text-xs text-slate-500 mb-4">
            Searched Gmail for: <span className="font-mono text-slate-600">{gmailQuery}</span>
          </p>
        )}

        {searched && !loading && (
          <>
            {summary && (
              <div className="mb-6 bg-white border border-primary-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-coral-500">✨</span>
                  <h2 className="font-semibold text-primary-900 text-sm">AI Summary</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            )}

            {threads.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {threads.length} Thread{threads.length !== 1 ? "s" : ""} Found
                </h2>
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <div key={thread.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                        className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                            {getInitials(thread.participants[0] ?? "?")}
                          </div>
                          <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 text-sm truncate">{thread.subject}</div>
                              <div className="text-xs text-slate-500 mt-0.5 truncate">
                                {thread.participants.join(", ")}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 shrink-0">
                              {formatDate(thread.lastDate)}
                            </div>
                          </div>
                        </div>
                      </button>

                      {expandedThread === thread.id && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-72 overflow-y-auto">
                          {thread.messages.map((msg) => (
                            <div key={msg.id} className="px-5 py-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-700">{msg.from}</span>
                                <span className="text-xs text-slate-400">{formatDate(msg.date)}</span>
                              </div>
                              <p className="text-xs text-slate-500 whitespace-pre-wrap line-clamp-3">
                                {msg.body || msg.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-3xl mb-2">📭</div>
                <p>No emails found for "{query}"</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
