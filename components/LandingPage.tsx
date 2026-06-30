"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

// ── Tiny SVG helpers ──────────────────────────────────────────────────────────

function GmailIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 36h6V22.8L4 16v18c0 1.1.9 2 2 2z" fill="#4285F4" />
      <path d="M36 36h6c1.1 0 2-.9 2-2V16l-8 6.8V36z" fill="#34A853" />
      <path d="M36 12l-12 9-12-9H6l18 13.8L42 12h-6z" fill="#EA4335" />
      <path d="M4 16l8 6.8V12H6c-1.1 0-2 .9-2 2v2z" fill="#FBBC05" />
      <path d="M44 14v2l-8 6.8V12h6c1.1 0 2 .9 2 2z" fill="#34A853" />
    </svg>
  )
}

function OutlookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#0078D4" />
      <path d="M8 14h20v20H8z" fill="#1490DF" />
      <path d="M28 14h12v4L28 26V14z" fill="white" opacity="0.5" />
      <path d="M40 14v20H28V26l12-8z" fill="white" opacity="0.3" />
      <path d="M8 34l20 6V20L8 14v20z" fill="#28A8E0" />
      <ellipse cx="18" cy="24" rx="6" ry="7" fill="white" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function ClarioMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.5 1.6c.7 5.7 1.9 6.9 7.6 7.6-5.7.7-6.9 1.9-7.6 7.6-.7-5.7-1.9-6.9-7.6-7.6 5.7-.7 6.9-1.9 7.6-7.6Z" />
      <path d="M18.4 14.2c.35 2.6.95 3.2 3.55 3.55-2.6.35-3.2.95-3.55 3.55-.35-2.6-.95-3.2-3.55-3.55 2.6-.35 3.2-.95 3.55-3.55Z" opacity="0.9" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4.18l7 3.12V11c0 4.07-2.7 7.86-7 9.23-4.3-1.37-7-5.16-7-9.23V8.3l7-3.12z" />
    </svg>
  )
}

// ── Connect inbox modal ───────────────────────────────────────────────────────

function ConnectModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleGmail() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <MailIcon className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2735]">Connect your inbox</h2>
          <p className="text-slate-500 text-sm mt-1.5">
            Choose your email provider to get started
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGmail}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all font-medium text-sm text-[#1B2735] disabled:opacity-60"
          >
            <GmailIcon size={22} />
            <span>{loading ? "Connecting…" : "Continue with Gmail"}</span>
            {!loading && (
              <svg className="w-4 h-4 ml-auto text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 cursor-not-allowed text-sm font-medium"
          >
            <OutlookIcon size={22} />
            <span>Outlook</span>
            <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded-full">Coming soon</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 leading-relaxed">
          Read-only access · Emails never stored · Disconnect anytime from Google settings
        </p>
      </div>
    </div>
  )
}

// ── Mock inbox data ───────────────────────────────────────────────────────────

const mockEmails = [
  { from: "Sarah Chen", subject: "Q3 design review — feedback needed", tag: "Work", time: "9:41 AM", unread: true, color: "#3D7EC9" },
  { from: "GitHub", subject: "PR #204 merged into main", tag: "Updates", time: "9:15 AM", unread: false, color: "#7C3AED" },
  { from: "Stripe", subject: "Invoice #4821 paid — $1,200.00", tag: "Finance", time: "8:52 AM", unread: false, color: "#059669" },
  { from: "Jordan Lee", subject: "Coffee next week?", tag: "Personal", time: "Yesterday", unread: true, color: "#D97706" },
]

const tagStyle: Record<string, string> = {
  Work: "bg-blue-50 text-blue-600",
  Updates: "bg-violet-50 text-violet-600",
  Finance: "bg-emerald-50 text-emerald-600",
  Personal: "bg-amber-50 text-amber-600",
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)

  function openModal() { setModalOpen(true) }
  function signInDirect() { signIn("google", { callbackUrl: "/dashboard" }) }

  return (
    <div className="min-h-screen bg-primary-50" style={{ fontFamily: "var(--font-sans, 'Hanken Grotesk', sans-serif)" }}>
      {modalOpen && <ConnectModal onClose={() => setModalOpen(false)} />}

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-primary-100/80" style={{ background: "rgba(239,244,251,0.85)", backdropFilter: "blur(14px)" }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold text-[#1B2735] text-lg">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white shrink-0">
              <ClarioMark size={15} />
            </span>
            Clario
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it works</a>
            <a href="#privacy" className="hover:text-primary-600 transition-colors">Privacy</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={signInDirect}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-[#1B2735] rounded-full hover:bg-white/70 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={openModal}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-28 px-5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-7 bg-primary-100 text-primary-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
              Now in early access
            </div>

            <h1
              className="text-5xl lg:text-[3.75rem] leading-[1.08] tracking-tight text-[#1B2735]"
              style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
            >
              Your inbox,<br />
              <span className="text-primary-600">finally</span><br />
              under control
            </h1>

            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-[26rem]">
              Clario reads your emails, sorts them intelligently, and drafts
              replies in your voice — so you can focus on what actually matters.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
              >
                Connect your email
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[#1B2735] border-2 border-[#1B2735]/15 hover:bg-white/70 transition-colors"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-xs text-slate-400 flex items-center gap-2">
              <ShieldIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              Read-only Gmail access · Emails never stored · Disconnect anytime
            </p>
          </div>

          {/* Inbox mockup */}
          <div className="relative mt-4 lg:mt-0">
            {/* Main card */}
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden">
              {/* Window chrome */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-xs text-slate-400 font-medium bg-slate-50 rounded-md px-3 py-1">
                    Clario — Inbox
                  </span>
                </div>
              </div>

              {/* Category tabs */}
              <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-slate-100 overflow-x-auto scrollbar-none">
                {["All", "Work", "Finance", "Updates", "Personal"].map((tab, i) => (
                  <span
                    key={tab}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                      i === 0
                        ? "text-white bg-primary-600"
                        : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              {/* Email rows */}
              <div className="divide-y divide-slate-50">
                {mockEmails.map((email, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 flex items-center gap-3 ${i === 0 ? "bg-primary-50/60" : ""}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: email.color }}
                    >
                      {email.from[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${email.unread ? "font-bold text-slate-900" : "text-slate-600"}`}>
                          {email.from}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">{email.time}</span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${email.unread ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                        {email.subject}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tagStyle[email.tag]}`}>
                      {email.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating AI reply card */}
            <div className="absolute -bottom-6 -right-4 sm:-right-8 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-56">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#1B2735]">AI Draft</span>
                <span className="ml-auto text-xs text-emerald-500 font-medium">Ready</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Hi Sarah, thanks for sharing! I'll review the designs before Thursday's call…"
              </p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 text-xs py-1.5 rounded-lg text-white bg-primary-600 font-semibold">
                  Send
                </button>
                <button className="flex-1 text-xs py-1.5 rounded-lg text-slate-500 bg-slate-100 font-semibold">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-slate-400 mb-8">
            Works with
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16">
            <div className="flex items-center gap-2.5">
              <GmailIcon size={22} />
              <span className="font-semibold text-slate-700 text-sm">Gmail</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-40">
              <OutlookIcon size={22} />
              <span className="font-semibold text-slate-700 text-sm">Outlook</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Soon</span>
            </div>
            <div className="flex items-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#4285F4" />
                <text x="4" y="17" fontSize="13" fontWeight="bold" fill="white">G</text>
              </svg>
              <span className="font-semibold text-slate-700 text-sm">Google Workspace</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 bg-primary-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary-600 mb-4">
              Why Clario
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#1B2735]"
              style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
            >
              Spend minutes on email, not hours.
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-md mx-auto">
              Three quiet shifts that give you your morning back.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: "📂",
                title: "Sorted before you look",
                desc: "Every message lands pre-tagged into the right project and category, so your inbox is organized the moment you open it.",
              },
              {
                emoji: "⚡",
                title: "Long threads, one line",
                desc: "Twenty-message chains collapse into a single sentence. Catch up on anything in seconds, not scrolls.",
              },
              {
                emoji: "✍️",
                title: "Replies in your voice",
                desc: "Clario drafts thoughtful responses that sound like you. Skim, tweak if you like, and send.",
              },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-primary-100 text-2xl">
                  {emoji}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">{title}</h3>
                <p className="text-sm leading-relaxed text-primary-800/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature spotlights ─────────────────────────────────────────────── */}
      <div id="how-it-works" className="bg-white">

        {/* 01 — Ask anything */}
        <section className="border-t border-slate-100 py-20 px-5">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div>
              <p className="text-lg font-semibold text-slate-300 mb-1">01</p>
              <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">Ask Anything</p>
              <h3
                className="text-4xl sm:text-5xl font-bold text-[#1B2735] mb-5 leading-tight"
                style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
              >
                Your inbox, answerable.
              </h3>
              <p className="text-slate-500 leading-relaxed mb-7 max-w-sm">
                Ask in plain language and Clario reads across every thread to answer — what needs a reply, what you promised, what changed.
              </p>
              <ul className="space-y-3">
                {[
                  '"What did I commit to this week?"',
                  '"Summarize everything from the Riverside deal."',
                  '"Who am I still waiting on?"',
                ].map((q) => (
                  <li key={q} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="text-primary-500 mt-0.5 flex-shrink-0 text-xs">✦</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup */}
            <div className="bg-primary-50 rounded-2xl p-5">
              <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm border border-slate-100">
                <span className="text-primary-500 text-xs flex-shrink-0">✦</span>
                <span className="text-sm text-[#1B2735]">What did I commit to this week?</span>
              </div>
              <div className="mt-3 rounded-xl p-4">
                <p className="text-sm text-slate-500 leading-relaxed">
                  You promised James a cost comparison by Friday, told Sarah you'd confirm the lease by end of week, and owe Marcus 15 minutes on the LOI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — Smart auto-tagging */}
        <section className="border-t border-slate-100 py-20 px-5">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Mockup — left on desktop, bottom on mobile */}
            <div className="order-last lg:order-first bg-primary-50 rounded-2xl p-5 space-y-2.5">
              {[
                { label: "Cleaning — Operations", count: 19, color: "#3D7EC9" },
                { label: "Business Acquisition",  count: 15, color: "#7C3AED" },
                { label: "Marketing & Tools",      count: 3,  color: "#059669" },
                { label: "Housing & Lease",        count: 1,  color: "#10B981" },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-sm text-[#1B2735] flex-1">{label}</span>
                  <span className="text-sm text-slate-400 font-medium tabular-nums">{count}</span>
                </div>
              ))}
            </div>

            {/* Copy */}
            <div>
              <p className="text-lg font-semibold text-slate-300 mb-1">02</p>
              <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">Smart Auto-Tagging</p>
              <h3
                className="text-4xl sm:text-5xl font-bold text-[#1B2735] mb-5 leading-tight"
                style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
              >
                Organized without lifting a finger.
              </h3>
              <p className="text-slate-500 leading-relaxed mb-7 max-w-sm">
                Clario learns your categories and files every incoming message automatically — no rules to build, no folders to drag.
              </p>
              <ul className="space-y-3">
                {[
                  "Learns from how you already sort",
                  "Adapts as new projects appear",
                  "One clean view, always current",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-primary-700 font-medium">
                    <span className="text-primary-500 mt-0.5 flex-shrink-0 text-xs">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 03 — Thread summaries */}
        <section className="border-t border-slate-100 py-20 px-5">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div>
              <p className="text-lg font-semibold text-slate-300 mb-1">03</p>
              <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">Thread Summaries</p>
              <h3
                className="text-4xl sm:text-5xl font-bold text-[#1B2735] mb-5 leading-tight"
                style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
              >
                The gist, instantly.
              </h3>
              <p className="text-slate-500 leading-relaxed mb-7 max-w-sm">
                Open any long conversation and read a one-line summary first. Choose the latest message, the last five, or the whole history.
              </p>
              <ul className="space-y-3">
                {[
                  "Latest · Last 5 · Last 10 · All",
                  "Catch up before a meeting in seconds",
                  "Never re-read a 30-reply chain again",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-primary-700 font-medium">
                    <span className="text-primary-500 mt-0.5 flex-shrink-0 text-xs">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup */}
            <div className="bg-primary-50 rounded-2xl p-5">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-4">
                {["Latest", "Last 5", "Last 10", "All"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      tab === "Last 5"
                        ? "bg-primary-600 text-white"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {/* Summary card */}
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <p className="text-xs font-bold tracking-widest uppercase text-primary-500 mb-3 flex items-center gap-1.5">
                  <span>✦</span> Summary · Last 5 Messages
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The team agreed to consolidate onto one tool. James will share a cost comparison before Friday so a final decision can be made.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — AI draft replies */}
        <section className="border-t border-slate-100 py-20 px-5">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Mockup — left on desktop */}
            <div className="order-last lg:order-first bg-primary-50 rounded-2xl p-5">
              <p className="text-xs font-semibold text-primary-500 mb-3 flex items-center gap-1.5">
                <span>✦</span> Draft reply · your voice
              </p>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
                <p className="text-sm text-primary-700 leading-relaxed">
                  Thanks James — agree on consolidating onto one tool. Friday works for the cost review; send it over whenever it's ready and I'll take a look. Best, Nick
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                  Send
                </button>
                <button className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                  Edit
                </button>
              </div>
            </div>

            {/* Copy */}
            <div>
              <p className="text-lg font-semibold text-slate-300 mb-1">04</p>
              <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">AI Draft Replies</p>
              <h3
                className="text-4xl sm:text-5xl font-bold text-[#1B2735] mb-5 leading-tight"
                style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
              >
                A reply, ready to send.
              </h3>
              <p className="text-slate-500 leading-relaxed mb-7 max-w-sm">
                Clario writes a complete draft in your tone using the full thread context. You stay in control — nothing sends without your tap.
              </p>
              <ul className="space-y-3">
                {[
                  "Matches your voice and tone",
                  "Uses the whole thread for context",
                  "Always waits for your approval",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-primary-700 font-medium">
                    <span className="text-primary-500 mt-0.5 flex-shrink-0 text-xs">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

      </div>

      {/* ── Privacy card ───────────────────────────────────────────────────── */}
      <section id="privacy" className="py-24 px-5 bg-primary-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary-50">
              <ShieldIcon className="w-7 h-7 text-primary-600" />
            </div>
            <h2
              className="text-3xl font-bold text-[#1B2735] mb-4"
              style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
            >
              Built with privacy at the core
            </h2>
            <p className="text-slate-500 leading-relaxed max-w-xl mx-auto mb-10">
              Your emails are processed in real time and never stored on Clario's servers. Your AI API key lives
              only in your browser's local storage. You can revoke Gmail access from Google's account settings at any time.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "Zero", label: "Emails stored" },
                { value: "Read-only", label: "Gmail access" },
                { value: "Your browser", label: "API key location" },
              ].map(({ value, label }) => (
                <div key={label} className="p-4 rounded-2xl bg-primary-50">
                  <div className="text-lg font-bold text-primary-600">{value}</div>
                  <div className="text-xs text-slate-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Dark CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-5 bg-[#1B2735]">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }}
          >
            Ready for an inbox<br className="hidden sm:block" /> that works for you?
          </h2>
          <p className="text-slate-400 text-lg mb-9">
            Connect your Gmail in seconds. No credit card required.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-lg bg-primary-600 hover:bg-primary-500 transition-colors shadow-xl shadow-primary-600/30"
          >
            Get started for free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <p className="text-slate-600 text-sm mt-5">Read-only access · Disconnect anytime</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-5 border-t border-white/5 bg-[#1B2735]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-white text-lg">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white shrink-0">
              <ClarioMark size={15} />
            </span>
            Clario
          </div>
          <p className="text-slate-500 text-sm">© 2026 Clario. Built with care.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
