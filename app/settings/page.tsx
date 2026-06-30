"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSettings } from "@/lib/useSettings"

interface LinkedAccountPublic {
  email: string
  name: string
  picture?: string
}

const NAV_SECTIONS = [
  { id: "profile",       label: "Profile" },
  { id: "ai",            label: "AI assistant" },
  { id: "signature",     label: "Signature" },
  { id: "categories",    label: "Categories & labels" },
  { id: "notifications", label: "Notifications" },
  { id: "accounts",      label: "Connected accounts" },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        on ? "bg-primary-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

function ToneButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm rounded-full border font-medium transition-colors ${
        active
          ? "bg-primary-600 text-white border-primary-600"
          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  )
}

const GmailIcon = () => (
  <svg className="w-7 h-7 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 10.5h39v27h-39z" fill="#fff" />
    <path d="M4.5 10.5v27h39v-27L24 25.5 4.5 10.5Z" fill="#fff" stroke="#DADCE0" strokeWidth="1.5" />
    <path d="M4.5 10.5 24 25.5l19.5-15" stroke="#EA4335" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

function AccountRow({
  name,
  email,
  picture,
  badge,
  onDisconnect,
  disconnecting,
}: {
  name: string
  email: string
  picture?: string
  badge?: string
  onDisconnect?: () => void
  disconnecting?: boolean
}) {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      {picture ? (
        <img src={picture} alt={name} className="w-9 h-9 rounded-full shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
          {name ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?"}
        </div>
      )}
      <GmailIcon />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 text-sm">{name || email}</div>
        <div className="text-xs text-slate-500 truncate">{email}</div>
      </div>
      {badge ? (
        <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
          {badge}
        </span>
      ) : onDisconnect ? (
        <button
          onClick={onDisconnect}
          disabled={disconnecting}
          className="shrink-0 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40"
        >
          {disconnecting ? "Removing…" : "Disconnect"}
        </button>
      ) : null}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { settings, setSettings, loaded } = useSettings()
  const [activeSection, setActiveSection] = useState("profile")
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountPublic[]>([])
  const [linkBanner, setLinkBanner] = useState<"success" | "error" | "same-account" | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const user = session?.user
  const initials = user?.name
    ? user.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  // Fetch linked accounts on mount
  useEffect(() => {
    fetch("/api/auth/linked-accounts")
      .then((r) => r.json())
      .then((d) => setLinkedAccounts(d.accounts ?? []))
      .catch(() => {})
  }, [])

  // Handle ?linked= query param from OAuth redirect
  useEffect(() => {
    const linked = searchParams.get("linked")
    if (!linked) return
    setLinkBanner(linked as any)
    if (linked === "success") {
      // Reload linked accounts
      fetch("/api/auth/linked-accounts")
        .then((r) => r.json())
        .then((d) => setLinkedAccounts(d.accounts ?? []))
        .catch(() => {})
    }
    // Scroll to accounts section and clear query param
    document.getElementById("section-accounts")?.scrollIntoView({ behavior: "smooth", block: "start" })
    router.replace("/settings", { scroll: false })
    // Auto-dismiss banner after 5s
    const t = setTimeout(() => setLinkBanner(null), 5000)
    return () => clearTimeout(t)
  }, [searchParams, router])

  async function disconnectAccount(email: string) {
    setDisconnecting(email)
    try {
      await fetch(`/api/auth/linked-accounts?email=${encodeURIComponent(email)}`, { method: "DELETE" })
      setLinkedAccounts((prev) => prev.filter((a) => a.email !== email))
    } finally {
      setDisconnecting(null)
    }
  }

  // Scrollspy: highlight whichever section is nearest the top of the panel
  useEffect(() => {
    const container = mainRef.current
    if (!container || !loaded) return

    const observers: IntersectionObserver[] = []
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(`section-${id}`)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { root: container, threshold: 0, rootMargin: "0px 0px -70% 0px" }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [loaded])

  function scrollTo(id: string) {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (!loaded) return null

  return (
    <div className="flex h-screen bg-primary-50 overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 border-r border-primary-200 bg-primary-100 pt-6">
        <div className="px-5 mb-6">
          <h1 className="text-base font-bold text-slate-800">Settings</h1>
        </div>
        <nav className="space-y-0.5 px-3">
          {NAV_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === id
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-slate-500 hover:bg-primary-50 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content — scrollable */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-10 py-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Settings</h2>
        <p className="text-sm text-slate-500 mb-8">Tune how Clario reads, sorts, and writes your mail.</p>

        <div className="space-y-6 max-w-3xl">

          {/* ── Profile ── */}
          <section id="section-profile" className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
            {user?.image ? (
              <img src={user.image} alt={user.name ?? ""} className="w-14 h-14 rounded-full shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-base">{user?.name}</div>
              <div className="text-sm text-slate-500 mt-0.5">{user?.email} · Connected via Gmail</div>
            </div>
            <button className="shrink-0 px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">
              Edit profile
            </button>
          </section>

          {/* ── AI assistant ── */}
          <section id="section-ai" className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <div className="px-6 py-5">
              <h3 className="font-semibold text-slate-800 text-base mb-0.5">AI assistant</h3>
            </div>

            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Default tone</div>
                <div className="text-xs text-slate-400 mt-0.5">Voice Clario uses when drafting replies.</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(["professional", "friendly", "concise"] as const).map((tone) => (
                  <ToneButton
                    key={tone}
                    label={tone.charAt(0).toUpperCase() + tone.slice(1)}
                    active={settings.defaultTone === tone}
                    onClick={() => setSettings({ defaultTone: tone })}
                  />
                ))}
              </div>
            </div>

            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Auto-summarize long threads</div>
                <div className="text-xs text-slate-400 mt-0.5">Show a one-line summary atop threads with 4+ messages.</div>
              </div>
              <Toggle on={settings.autoSummarize} onChange={(v) => setSettings({ autoSummarize: v })} />
            </div>

            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Smart auto-tagging</div>
                <div className="text-xs text-slate-400 mt-0.5">Automatically sort new mail into your categories.</div>
              </div>
              <Toggle on={settings.smartAutoTagging} onChange={(v) => setSettings({ smartAutoTagging: v })} />
            </div>

            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Default reply context</div>
                <div className="text-xs text-slate-400 mt-0.5">How much of a thread Clario reads before drafting.</div>
              </div>
              <select
                value={settings.defaultReplyContext}
                onChange={(e) => setSettings({ defaultReplyContext: e.target.value as "latest" | "full" | "none" })}
                className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-primary-400 shrink-0"
              >
                <option value="latest">Latest message</option>
                <option value="full">This thread</option>
                <option value="none">Manual only</option>
              </select>
            </div>

          </section>

          {/* ── Signature ── */}
          <section id="section-signature" className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-4">Signature</h3>
            <textarea
              value={settings.signature}
              onChange={(e) => setSettings({ signature: e.target.value })}
              placeholder={`${user?.name ?? "Your name"}\nClario — AI email assistant`}
              rows={5}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary-400 resize-y font-sans leading-relaxed placeholder:text-slate-300"
            />
            <p className="text-xs text-slate-400 mt-2">Appended to the bottom of AI-drafted replies.</p>
          </section>

          {/* ── Categories & labels ── */}
          <section id="section-categories" className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-1">Categories &amp; labels</h3>
            <p className="text-sm text-slate-500">
              Categories are managed automatically by the AI. Rename them from the inbox sidebar by hovering a category and clicking the pencil icon.
            </p>
          </section>

          {/* ── Notifications ── */}
          <section id="section-notifications" className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-2">Notifications</h3>
            <p className="text-sm text-slate-500">Notification preferences coming soon.</p>
          </section>

          {/* ── Connected accounts ── */}
          <section id="section-accounts" className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-10">
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-base mb-0.5">Connected accounts</h3>
                <p className="text-sm text-slate-500">All Google accounts linked to Clario.</p>
              </div>
              <a
                href="/api/auth/link-google"
                className="shrink-0 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                + Connect account
              </a>
            </div>

            {/* Link result banner */}
            {linkBanner && (
              <div className={`px-6 py-3 text-sm font-medium ${
                linkBanner === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : linkBanner === "same-account"
                  ? "bg-amber-50 text-amber-700 border-amber-100"
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {linkBanner === "success" && "Account connected successfully."}
                {linkBanner === "same-account" && "That account is already your primary account."}
                {linkBanner === "error" && "Could not connect account. Please try again."}
              </div>
            )}

            {/* Primary account */}
            <AccountRow
              name={user?.name ?? ""}
              email={user?.email ?? ""}
              picture={user?.image ?? undefined}
              badge="Primary"
            />

            {/* Linked accounts */}
            {linkedAccounts.map((acct: LinkedAccountPublic) => (
              <AccountRow
                key={acct.email}
                name={acct.name}
                email={acct.email}
                picture={acct.picture}
                onDisconnect={() => disconnectAccount(acct.email)}
                disconnecting={disconnecting === acct.email}
              />
            ))}

            {linkedAccounts.length === 0 && (
              <div className="px-6 py-4 text-sm text-slate-400">
                No additional accounts linked yet.
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  )
}
