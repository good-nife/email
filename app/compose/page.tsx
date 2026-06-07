"use client"

import { useRef, useState, Suspense } from "react"
import { useRouter } from "next/navigation"

function execFormat(command: string) {
  document.execCommand(command, false)
}

function ComposePage() {
  const router = useRouter()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [context, setContext] = useState("")
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleDraft() {
    setLoadingDraft(true)
    setError("")
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, context }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (bodyRef.current) {
        bodyRef.current.innerHTML = data.draft
          .split("\n\n")
          .map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
          .join("")
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate draft")
    } finally {
      setLoadingDraft(false)
    }
  }

  async function handleSend() {
    const body = bodyRef.current?.innerHTML ?? ""
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
        body: JSON.stringify({ to, subject, body }),
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
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" style={{ minHeight: 560 }}>

        {/* Outlook-style dark header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-700 text-white shrink-0">
          <span className="text-sm font-medium">{subject || "New Message"}</span>
          <button
            onClick={() => router.back()}
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* To / Subject / Notes */}
        <div className="border-b border-slate-100 shrink-0">
          <div className="flex items-center px-5 py-3 border-b border-slate-100">
            <span className="text-xs text-slate-400 w-16 shrink-0">To</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300"
            />
          </div>
          <div className="flex items-center px-5 py-3 border-b border-slate-100">
            <span className="text-xs text-slate-400 w-16 shrink-0">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300 font-medium"
            />
          </div>
          <div className="flex items-center px-5 py-3">
            <span className="text-xs text-slate-400 w-16 shrink-0">Notes</span>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What should the AI cover? (optional)"
              className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-slate-100 bg-slate-50 shrink-0">
          {[
            { label: "B", cmd: "bold", className: "font-bold" },
            { label: "I", cmd: "italic", className: "italic" },
            { label: "U", cmd: "underline", className: "underline" },
          ].map(({ label, cmd, className }) => (
            <button
              key={cmd}
              onMouseDown={(e) => { e.preventDefault(); execFormat(cmd) }}
              className={`w-7 h-7 flex items-center justify-center text-sm text-slate-600 hover:bg-slate-200 rounded transition-colors ${className}`}
            >
              {label}
            </button>
          ))}
          <span className="w-px h-4 bg-slate-300 mx-1.5 shrink-0" />
          <button
            onMouseDown={(e) => { e.preventDefault(); execFormat("insertUnorderedList") }}
            className="px-2 h-7 flex items-center text-xs text-slate-600 hover:bg-slate-200 rounded gap-1 transition-colors"
          >
            <span>•</span><span>List</span>
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); execFormat("insertOrderedList") }}
            className="px-2 h-7 flex items-center text-xs text-slate-600 hover:bg-slate-200 rounded gap-1 transition-colors"
          >
            <span>1.</span><span>List</span>
          </button>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write your message or click 'AI Draft'…"
          className="flex-1 px-5 py-4 text-sm text-slate-900 outline-none leading-relaxed overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 empty:before:pointer-events-none"
        />

        {/* Error */}
        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100 shrink-0">
            {error}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-full transition-colors"
          >
            {sending ? "Sending…" : "Send"}
          </button>
          <button
            onClick={handleDraft}
            disabled={loadingDraft}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-40 rounded-full transition-colors"
          >
            {loadingDraft ? "Writing…" : "✨ AI Draft"}
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
