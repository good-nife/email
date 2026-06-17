"use client"

import { useState, useRef, useEffect } from "react"
import { Thread } from "@/types"

interface ComposePanelProps {
  threadId?: string
  thread?: Thread
  scope?: string
  autoDraft?: boolean
  categories?: string[]
  defaultCategory?: string
  onClose: () => void
  onSent?: () => void
}

export default function ComposePanel({ threadId, thread, scope = "full", autoDraft = false, categories = [], defaultCategory = "", onClose, onSent }: ComposePanelProps) {
  const [minimized, setMinimized] = useState(false)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState(defaultCategory)
  const [context, setContext] = useState("")
  const [loadingThread, setLoadingThread] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!threadId) return
    if (thread) {
      setTo(thread.messages[0]?.fromEmail ?? "")
      setSubject(`Re: ${thread.subject}`)
    } else {
      loadThread()
    }
    if (autoDraft) handleDraft()
  }, [threadId])

  async function loadThread() {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/thread/${threadId}`)
      if (!res.ok) throw new Error("Failed to load thread")
      const data = await res.json()
      setTo(data.thread.messages[0]?.fromEmail ?? "")
      setSubject(`Re: ${data.thread.subject}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingThread(false)
    }
  }

  function execFormat(command: string) {
    document.execCommand(command, false)
    bodyRef.current?.focus()
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
            ? { threadId, scope, category: category || undefined, context: context || undefined }
            : { to, subject, category: category || undefined, context: context || undefined }
        ),
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
        body: JSON.stringify({ to, subject, body, threadId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSent(true)
      setTimeout(() => { onSent?.(); onClose() }, 1500)
    } catch (e: any) {
      setError(e.message || "Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed bottom-0 right-6 w-[560px] bg-white shadow-2xl rounded-t-xl border border-slate-200 z-50 flex flex-col"
      style={{ maxHeight: "calc(100vh - 5rem)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-primary-900 text-white rounded-t-xl cursor-pointer select-none shrink-0"
        onClick={() => setMinimized((m) => !m)}
      >
        <span className="text-sm font-medium truncate">
          {sent ? "Sent!" : subject || "New Message"}
        </span>
        <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMinimized((m) => !m)}
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
          >
            {minimized ? "▲" : "▼"}
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* To / Subject */}
          <div className="border-b border-slate-100 shrink-0">
            <div className="flex items-center px-4 py-2.5 border-b border-slate-100">
              <span className="text-xs text-slate-400 w-14 shrink-0">To</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-slate-400 w-14 shrink-0">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300 font-medium"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex items-center px-4 py-2.5 border-t border-slate-100">
                <span className="text-xs text-slate-400 w-14 shrink-0" title="Pulls in related emails from this category as extra context for the AI draft">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 text-sm text-slate-600 outline-none bg-transparent"
                >
                  <option value="">None — general tone only</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center px-4 py-2.5 border-t border-slate-100">
              <span className="text-xs text-slate-400 w-14 shrink-0">Context</span>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What should the AI cover? (optional)"
                className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50 shrink-0">
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
              className="px-2 h-7 flex items-center text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors gap-1"
            >
              <span>•</span><span>List</span>
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); execFormat("insertOrderedList") }}
              className="px-2 h-7 flex items-center text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors gap-1"
            >
              <span>1.</span><span>List</span>
            </button>
          </div>

          {/* Body */}
          {loadingThread ? (
            <div className="flex-1 px-4 py-3 text-sm text-slate-400 min-h-[200px]">Loading thread…</div>
          ) : (
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Write your message or click 'AI Draft'…"
              className="flex-1 min-h-[200px] px-4 py-3 text-sm text-slate-900 outline-none overflow-y-auto leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 empty:before:pointer-events-none"
            />
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100 shrink-0">
              {error}
            </div>
          )}

          {/* Bottom toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
            <button
              onClick={handleSend}
              disabled={sending || sent}
              className="px-5 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-medium rounded-full transition-colors"
            >
              {sending ? "Sending…" : sent ? "Sent!" : "Send"}
            </button>
            <button
              onClick={handleDraft}
              disabled={loadingDraft}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-coral-50 hover:text-coral-600 disabled:opacity-40 rounded-full transition-colors"
            >
              {loadingDraft ? "Writing…" : "✦ AI Draft"}
            </button>
            <button
              onClick={onClose}
              className="ml-auto w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Discard"
            >
              🗑
            </button>
          </div>
        </>
      )}
    </div>
  )
}
