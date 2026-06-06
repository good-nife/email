"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Thread } from "@/types"

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
}

function ComposePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get("mode") // "reply" or null (new)
  const threadId = searchParams.get("threadId")

  const [thread, setThread] = useState<Thread | null>(null)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [context, setContext] = useState("")
  const [loadingThread, setLoadingThread] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (mode === "reply" && threadId) {
      loadThread(threadId)
    }
  }, [mode, threadId])

  async function loadThread(id: string) {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/thread/${id}`)
      if (!res.ok) throw new Error("Failed to load thread")
      const data = await res.json()
      setThread(data.thread)
      setTo(data.thread.messages[0]?.fromEmail ?? "")
      setSubject(`Re: ${data.thread.subject}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingThread(false)
    }
  }

  async function handleDraft() {
    setLoadingDraft(true)
    setError("")
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          threadId
            ? { threadId }
            : { to, subject, context }
        ),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setBody(data.draft)
    } catch (e: any) {
      setError(e.message || "Failed to generate draft")
    } finally {
      setLoadingDraft(false)
    }
  }

  async function handleSend() {
    if (!to || !subject || !body) {
      setError("To, subject, and body are required.")
      return
    }
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, threadId: threadId ?? undefined }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSent(true)
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (e: any) {
      setError(e.message || "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-slate-800">Email sent!</h2>
        <p className="text-slate-500 mt-1">Returning to inbox…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700 transition-colors text-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "reply" ? "Reply" : "New Email"}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}{" "}
          {error.includes("API key") && <a href="/settings" className="underline font-medium">Settings</a>}
        </div>
      )}

      {/* Thread history */}
      {loadingThread && (
        <div className="mb-6 text-slate-400 text-sm">Loading thread…</div>
      )}
      {thread && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-700">
            Thread: {thread.subject}
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {thread.messages.map((msg) => (
              <div key={msg.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800">{msg.from}</span>
                  <span className="text-xs text-slate-400">{formatDate(msg.date)}</span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">{msg.body || msg.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compose form */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          <div className="flex items-center px-5 py-3 gap-3">
            <label className="text-sm font-medium text-slate-500 w-16">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300"
            />
          </div>
          <div className="flex items-center px-5 py-3 gap-3">
            <label className="text-sm font-medium text-slate-500 w-16">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300"
            />
          </div>

          {/* Context field for new emails */}
          {!threadId && (
            <div className="flex items-start px-5 py-3 gap-3">
              <label className="text-sm font-medium text-slate-500 w-16 pt-0.5">Notes</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What should the email cover? (optional — AI uses this to write the draft)"
                rows={2}
                className="flex-1 text-sm text-slate-900 outline-none resize-none placeholder:text-slate-300"
              />
            </div>
          )}

          <div className="px-5 py-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here, or click 'Draft with AI' below…"
              rows={10}
              className="w-full text-sm text-slate-900 outline-none resize-none placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {sending ? "Sending…" : "Send"}
          </button>

          <button
            onClick={handleDraft}
            disabled={loadingDraft}
            className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loadingDraft ? (
              <>⏳ Writing…</>
            ) : (
              <>✨ Draft with AI</>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}

export default function ComposePageWrapper() {
  return (
    <Suspense>
      <ComposePage />
    </Suspense>
  )
}
