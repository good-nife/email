"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

// ── SVG helpers ───────────────────────────────────────────────────────────────

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

// ── Modal ─────────────────────────────────────────────────────────────────────

function ConnectModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleGmail() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #EFF4FB 0%, #dce8f7 100%)" }}>
            <MailIcon className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2735]">Connect your inbox</h2>
          <p className="text-slate-500 text-sm mt-1.5">Choose your email provider to get started</p>
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
          Read-only access · Emails never stored · Revoke anytime from Google
        </p>
      </div>
    </div>
  )
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockEmails = [
  { from: "Sarah Chen",  subject: "Q3 design review — feedback needed", tag: "Work",     time: "9:41 AM",  unread: true,  color: "#3D7EC9" },
  { from: "GitHub",      subject: "PR #204 merged into main",           tag: "Updates",  time: "9:15 AM",  unread: false, color: "#7C3AED" },
  { from: "Stripe",      subject: "Invoice #4821 paid — $1,200.00",     tag: "Finance",  time: "8:52 AM",  unread: false, color: "#059669" },
  { from: "Jordan Lee",  subject: "Coffee next week?",                  tag: "Personal", time: "Yesterday",unread: true,  color: "#D97706" },
]

const tagStyle: Record<string, string> = {
  Work:     "bg-blue-50 text-blue-600",
  Updates:  "bg-violet-50 text-violet-600",
  Finance:  "bg-emerald-50 text-emerald-600",
  Personal: "bg-amber-50 text-amber-600",
}

const serif = { fontFamily: "var(--font-serif, 'Instrument Serif', serif)" }

// ── Landing page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)

  function openModal()    { setModalOpen(true) }
  function signInDirect() { signIn("google", { callbackUrl: "/dashboard" }) }

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-sans, 'Hanken Grotesk', sans-serif)", background: "#EFF4FB" }}>
      {modalOpen && <ConnectModal onClose={() => setModalOpen(false)} />}

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b border-slate-200/60"
        style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#1B2735] text-lg tracking-tight">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white shrink-0">
              <ClarioMark size={15} />
            </span>
            Clario
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features"    className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it works</a>
            <a href="#privacy"     className="hover:text-primary-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={signInDirect}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={openModal}
              className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90 shadow-md shadow-primary-600/20"
              style={{ background: "linear-gradient(135deg, #5390D5 0%, #3D7EC9 60%, #2E68B0 100%)" }}
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="pt-20 pb-32 px-6 overflow-hidden"
        style={{ background: "radial-gradient(ellipse 75% 65% at 72% 5%, rgba(61,126,201,0.13) 0%, transparent 65%), #EFF4FB" }}
      >
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border border-primary-200 bg-white text-primary-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              Now in early access
            </div>

            <h1
              className="text-5xl lg:text-[4.25rem] leading-[1.05] tracking-tight text-[#1B2735]"
              style={serif}
            >
              The inbox that<br />
              <span className="text-primary-600">reads, sorts &amp; replies</span><br />
              for you
            </h1>

            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-[27rem]">
              Clario reads your emails, sorts them intelligently, and drafts replies
              in your voice — so you can focus on what actually matters.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white text-[15px] transition-all hover:opacity-90 shadow-lg shadow-primary-600/30"
                style={{ background: "linear-gradient(135deg, #5390D5 0%, #3D7EC9 60%, #2E68B0 100%)" }}
              >
                Connect your email
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-slate-600 text-[15px] bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
              >
                See how it works
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5">
              {[
                "Works with Gmail & Outlook",
                "Read-only until you say send",
                "Disconnect anytime",
              ].map((point) => (
                <span key={point} className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* Inbox mockup */}
          <div className="relative mt-4 lg:mt-0">
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 24px 64px rgba(29,64,104,0.14), 0 4px 16px rgba(29,64,104,0.08)" }}
            >
              {/* Window chrome */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-xs text-slate-400 font-medium bg-white rounded-md px-3 py-1 border border-slate-200/80">
                    Clario — Inbox
                  </span>
                </div>
              </div>

              {/* Category tabs */}
              <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-slate-100 bg-white overflow-x-auto">
                {["All", "Work", "Finance", "Updates", "Personal"].map((tab, i) => (
                  <span
                    key={tab}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                      i === 0 ? "text-white" : "text-slate-500 bg-slate-100"
                    }`}
                    style={i === 0 ? { background: "linear-gradient(135deg, #5390D5, #3D7EC9)" } : {}}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              {/* Email rows */}
              <div className="divide-y divide-slate-50/80">
                {mockEmails.map((email, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3.5 flex items-center gap-3 ${i === 0 ? "bg-primary-50/50" : "bg-white"}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                      style={{ background: email.color }}
                    >
                      {email.from[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${email.unread ? "font-bold text-slate-900" : "text-slate-500"}`}>
                          {email.from}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">{email.time}</span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${email.unread ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                        {email.subject}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${tagStyle[email.tag]}`}>
                      {email.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating AI reply card */}
            <div
              className="absolute -bottom-5 -right-3 sm:-right-7 bg-white rounded-2xl p-4 w-56 border border-slate-100/80"
              style={{ boxShadow: "0 12px 40px rgba(29,64,104,0.14), 0 2px 8px rgba(29,64,104,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5390D5, #3D7EC9)" }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#1B2735]">AI Draft</span>
                <span className="ml-auto text-xs text-emerald-500 font-semibold">Ready ✓</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                "Hi Sarah, thanks for sharing! I'll review the designs before Thursday's call…"
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="flex-1 text-xs py-1.5 rounded-lg text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, #5390D5, #3D7EC9)" }}
                >
                  Send
                </button>
                <button className="flex-1 text-xs py-1.5 rounded-lg text-slate-600 bg-slate-100 font-semibold hover:bg-slate-200 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-slate-400 mb-8">
            Works seamlessly with
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            {[
              { icon: <GmailIcon size={20} />, label: "Gmail", muted: false },
              { icon: <OutlookIcon size={20} />, label: "Outlook", muted: true, badge: "Soon" },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#4285F4" />
                    <text x="4" y="17" fontSize="13" fontWeight="bold" fill="white">G</text>
                  </svg>
                ),
                label: "Google Workspace",
                muted: false,
              },
            ].map(({ icon, label, muted, badge }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-slate-50 ${muted ? "opacity-50" : "border-slate-200"}`}
                style={muted ? { borderStyle: "dashed", borderColor: "#e2e8f0" } : {}}
              >
                {icon}
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                {badge && <span className="text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">{badge}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 benefits ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6" style={{ background: "#EFF4FB" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">Why Clario</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#1B2735]" style={serif}>
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
              <div
                key={title}
                className="bg-white rounded-2xl p-7 border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-600/5 transition-all group"
                style={{ boxShadow: "0 2px 8px rgba(29,64,104,0.06)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-2xl"
                  style={{ background: "linear-gradient(135deg, #EFF4FB 0%, #dce8f7 100%)" }}>
                  {emoji}
                </div>
                <h3 className="font-bold text-[#1B2735] mb-2.5 text-base">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature spotlights ─────────────────────────────────────────────── */}
      <div id="how-it-works" className="bg-white">

        {[
          {
            num: "01",
            label: "Ask Anything",
            heading: "Your inbox, answerable.",
            body: "Ask in plain language and Clario reads across every thread to answer — what needs a reply, what you promised, what changed.",
            bullets: [
              '"What did I commit to this week?"',
              '"Summarize everything from the Riverside deal."',
              '"Who am I still waiting on?"',
            ],
            mockup: (
              <div className="space-y-3">
                <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-2.5 border border-slate-200 shadow-sm">
                  <span className="text-primary-500 text-xs flex-shrink-0">✦</span>
                  <span className="text-sm text-[#1B2735]">What did I commit to this week?</span>
                </div>
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <p className="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wide">Clario found</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You promised James a cost comparison by Friday, told Sarah you'd confirm the lease by end of week, and owe Marcus 15 minutes on the LOI.
                  </p>
                </div>
              </div>
            ),
            flip: false,
          },
          {
            num: "02",
            label: "Smart Auto-Tagging",
            heading: "Organized without lifting a finger.",
            body: "Clario learns your categories and files every incoming message automatically — no rules to build, no folders to drag.",
            bullets: [
              "Learns from how you already sort",
              "Adapts as new projects appear",
              "One clean view, always current",
            ],
            mockup: (
              <div className="space-y-2.5">
                {[
                  { label: "Cleaning — Operations", count: 19, color: "#3D7EC9" },
                  { label: "Business Acquisition",  count: 15, color: "#7C3AED" },
                  { label: "Marketing & Tools",      count: 3,  color: "#059669" },
                  { label: "Housing & Lease",        count: 1,  color: "#10B981" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-200 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm text-[#1B2735] flex-1 font-medium">{label}</span>
                    <span className="text-sm text-slate-400 tabular-nums font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ),
            flip: true,
          },
          {
            num: "03",
            label: "Thread Summaries",
            heading: "The gist, instantly.",
            body: "Open any long conversation and read a one-line summary first. Choose the latest message, the last five, or the whole history.",
            bullets: [
              "Latest · Last 5 · Last 10 · All",
              "Catch up before a meeting in seconds",
              "Never re-read a 30-reply chain again",
            ],
            mockup: (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  {["Latest", "Last 5", "Last 10", "All"].map((tab) => (
                    <button
                      key={tab}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        tab === "Last 5" ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 bg-slate-50"
                      }`}
                      style={tab === "Last 5" ? { background: "linear-gradient(135deg, #5390D5, #3D7EC9)" } : {}}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold tracking-widest uppercase text-primary-500 mb-3 flex items-center gap-1.5">
                    <span>✦</span> Summary · Last 5 Messages
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The team agreed to consolidate onto one tool. James will share a cost comparison before Friday so a final decision can be made.
                  </p>
                </div>
              </div>
            ),
            flip: false,
          },
          {
            num: "04",
            label: "AI Draft Replies",
            heading: "A reply, ready to send.",
            body: "Clario writes a complete draft in your tone using the full thread context. You stay in control — nothing sends without your tap.",
            bullets: [
              "Matches your voice and tone",
              "Uses the whole thread for context",
              "Always waits for your approval",
            ],
            mockup: (
              <div>
                <p className="text-xs font-semibold text-primary-500 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>✦</span> Draft reply · your voice
                </p>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-4">
                  <p className="text-sm text-primary-700 leading-relaxed">
                    Thanks James — agree on consolidating onto one tool. Friday works for the cost review; send it over whenever it's ready and I'll take a look. Best, Nick
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, #5390D5, #3D7EC9)" }}
                  >
                    Send
                  </button>
                  <button className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ),
            flip: true,
          },
        ].map(({ num, label, heading, body, bullets, mockup, flip }) => (
          <section key={num} className="border-t border-slate-100 py-20 px-6">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              {/* Copy — always first in DOM for mobile, order changes on desktop */}
              <div className={flip ? "lg:order-last" : ""}>
                <p className="text-xl font-bold text-slate-200 mb-1 tabular-nums">{num}</p>
                <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">{label}</p>
                <h3 className="text-4xl sm:text-5xl font-bold text-[#1B2735] mb-5 leading-tight" style={serif}>
                  {heading}
                </h3>
                <p className="text-slate-500 leading-relaxed mb-7 max-w-sm">{body}</p>
                <ul className="space-y-3">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm font-medium text-slate-600">
                      <span className="text-primary-500 flex-shrink-0 text-xs mt-0.5">✦</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup panel */}
              <div
                className={`rounded-2xl p-6 border border-slate-100 ${flip ? "lg:order-first" : ""}`}
                style={{ background: "linear-gradient(145deg, #f5f8fd 0%, #eef3fb 100%)", boxShadow: "0 4px 24px rgba(29,64,104,0.07)" }}
              >
                {mockup}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── 3 steps + privacy ──────────────────────────────────────────────── */}
      <section id="privacy" className="py-24 px-6" style={{ background: "#EFF4FB" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-4">Up and running in a minute</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#1B2735]" style={serif}>
              Three steps to a calmer inbox.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {[
              { n: "1", title: "Connect your email",  desc: "Link Gmail or Outlook in two clicks. Clario connects securely and read-only." },
              { n: "2", title: "Clario gets to work",  desc: "It reads, tags, and summarizes your inbox — usually within the first minute." },
              { n: "3", title: "Skim, approve, done",  desc: "Review AI-drafted replies, tap send on the ones you like, and reclaim your morning." },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-7 border border-slate-100"
                style={{ boxShadow: "0 2px 10px rgba(29,64,104,0.07)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white mb-5 shadow-sm"
                  style={{ background: "#1B2735" }}
                >
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Privacy card */}
          <div
            className="rounded-2xl p-8 sm:p-10 flex items-start gap-6 sm:gap-8 border border-primary-100"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(220,232,247,0.4) 100%)", boxShadow: "0 2px 12px rgba(61,126,201,0.08)" }}
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white shadow-sm border border-primary-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#1B2735] mb-3" style={serif}>
                Your mail stays yours.
              </h3>
              <p className="text-slate-500 leading-relaxed max-w-2xl">
                Clario reads your inbox to help you — it never sells data or sends anything without your tap.
                Connect read-only, revoke access anytime, and every draft waits for your approval before it goes out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dark CTA ───────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 relative overflow-hidden"
        style={{ background: "#111827" }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(61,126,201,0.22) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5"
            style={serif}
          >
            Ready for an inbox<br className="hidden sm:block" /> that works for you?
          </h2>
          <p className="text-slate-400 text-lg mb-9 max-w-xl mx-auto">
            Connect your email in seconds. No credit card, no commitment.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-white text-lg transition-all hover:opacity-90 shadow-xl"
            style={{ background: "linear-gradient(135deg, #5390D5 0%, #3D7EC9 60%, #2E68B0 100%)", boxShadow: "0 8px 32px rgba(61,126,201,0.40)" }}
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
      <footer className="py-10 px-6 border-t border-white/5" style={{ background: "#111827" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white text-lg">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white shrink-0">
              <ClarioMark size={15} />
            </span>
            Clario
          </div>
          <p className="text-slate-600 text-sm">© 2026 Clario. Built with care.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
