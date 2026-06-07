"use client"

import { useState } from "react"
import { Thread } from "@/types"

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError("")
    setSummary("")
    setThreads([])
    setSearched(false)
    setGmailQuery("")

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setThreads(data.threads)
      setSummary(data.summary)
      setGmailQuery(data.gmailQuery ?? "")
      setSearched(true)
    } catch (e: any) {
      setError(e.message || "Search failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Find Correspondence</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'John Smith', 'invoices from last year', 'emails about hiring contractors'"
          className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
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
        <p className="text-xs text-slate-400 mb-4">
          Searched Gmail for: <span className="font-mono text-slate-500">{gmailQuery}</span>
        </p>
      )}

      {searched && !loading && (
        <>
          {/* AI Summary */}
          {summary && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-600">✨</span>
                <h2 className="font-semibold text-blue-900 text-sm">AI Summary</h2>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
          )}

          {/* Thread list */}
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
                      <div className="flex items-start justify-between gap-3">
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
    </div>
  )
}
