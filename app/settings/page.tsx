"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { useSettings } from "@/lib/useSettings"
import { useAnthropicKey } from "@/hooks/useAnthropicKey"

const NAV_SECTIONS = [
  { id: "profile",    label: "Profile" },
  { id: "ai",         label: "AI assistant" },
  { id: "signature",  label: "Signature" },
  { id: "categories", label: "Categories & labels" },
  { id: "notifications", label: "Notifications" },
  { id: "accounts",   label: "Connected accounts" },
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

function ToneButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
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

export default function SettingsPage() {
  const { data: session } = useSession()
  const { settings, setSettings, loaded } = useSettings()
  const { apiKey, setApiKey, clearApiKey } = useAnthropicKey()
  const [activeSection, setActiveSection] = useState("profile")
  const [keyDraft, setKeyDraft] = useState("")
  const [keySaved, setKeySaved] = useState(false)

  const user = session?.user

  // Derive initials for avatar fallback
  const initials = user?.name
    ? user.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  if (!loaded) return null

  return (
    <div className="flex min-h-screen bg-primary-50">
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 border-r border-primary-200 bg-primary-100 pt-6">
        <div className="px-5 mb-6">
          <h1 className="text-base font-bold text-slate-800">Settings</h1>
        </div>
        <nav className="space-y-0.5 px-3">
          {NAV_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
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

      {/* Main content */}
      <main className="flex-1 px-10 py-10 max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Settings</h2>
        <p className="text-sm text-slate-500 mb-8">Tune how Clario reads, sorts, and writes your mail.</p>

        {/* ── Profile ── */}
        {activeSection === "profile" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
            {user?.image ? (
              <img src={user.image} alt={user.name ?? ""} className="w-14 h-14 rounded-full shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-base">{user?.name}</div>
              <div className="text-sm text-slate-500 mt-0.5">
                {user?.email} · Connected via Gmail
              </div>
            </div>
            <button className="shrink-0 px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">
              Edit profile
            </button>
          </section>
        )}

        {/* ── AI assistant ── */}
        {activeSection === "ai" && (
          <section className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <div className="px-6 py-5">
              <h3 className="font-semibold text-slate-800 text-base mb-0.5">AI assistant</h3>
            </div>

            {/* Default tone */}
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

            {/* Auto-summarize */}
            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Auto-summarize long threads</div>
                <div className="text-xs text-slate-400 mt-0.5">Show a one-line summary atop threads with 4+ messages.</div>
              </div>
              <Toggle
                on={settings.autoSummarize}
                onChange={(v) => setSettings({ autoSummarize: v })}
              />
            </div>

            {/* Smart auto-tagging */}
            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Smart auto-tagging</div>
                <div className="text-xs text-slate-400 mt-0.5">Automatically sort new mail into your categories.</div>
              </div>
              <Toggle
                on={settings.smartAutoTagging}
                onChange={(v) => setSettings({ smartAutoTagging: v })}
              />
            </div>

            {/* Default reply context */}
            <div className="px-6 py-5 flex items-start justify-between gap-6">
              <div>
                <div className="font-medium text-slate-800 text-sm">Default reply context</div>
                <div className="text-xs text-slate-400 mt-0.5">How much of a thread Clario reads before drafting.</div>
              </div>
              <select
                value={settings.defaultReplyContext}
                onChange={(e) =>
                  setSettings({ defaultReplyContext: e.target.value as "latest" | "full" | "none" })
                }
                className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-primary-400 shrink-0"
              >
                <option value="latest">Latest message</option>
                <option value="full">This thread</option>
                <option value="none">Manual only</option>
              </select>
            </div>

            {/* Anthropic API key */}
            <div className="px-6 py-5">
              <div className="font-medium text-slate-800 text-sm mb-0.5">Anthropic API key</div>
              <div className="text-xs text-slate-400 mb-3">
                Required for AI features.{" "}
                {apiKey ? (
                  <span className="text-emerald-600 font-medium">Key saved.</span>
                ) : (
                  <span className="text-amber-600 font-medium">No key set — AI features are disabled.</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={apiKey ? "••••••••••••••••" : "sk-ant-api03-…"}
                  value={keyDraft}
                  onChange={(e) => { setKeyDraft(e.target.value); setKeySaved(false) }}
                  className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                />
                <button
                  onClick={() => {
                    if (keyDraft.trim()) { setApiKey(keyDraft.trim()); setKeyDraft(""); setKeySaved(true) }
                  }}
                  disabled={!keyDraft.trim()}
                  className="px-4 py-1.5 text-sm rounded-lg bg-primary-600 text-white font-medium disabled:opacity-40 hover:bg-primary-700 transition-colors"
                >
                  {keySaved ? "Saved!" : "Save"}
                </button>
                {apiKey && (
                  <button
                    onClick={() => { clearApiKey(); setKeySaved(false) }}
                    className="px-4 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Signature ── */}
        {activeSection === "signature" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
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
        )}

        {/* ── Categories & labels ── */}
        {activeSection === "categories" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-2">Categories &amp; labels</h3>
            <p className="text-sm text-slate-500">
              Categories are managed automatically by the AI as new emails arrive. You can rename them
              directly from the inbox sidebar by hovering a category and clicking the ✏️ icon.
            </p>
          </section>
        )}

        {/* ── Notifications ── */}
        {activeSection === "notifications" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-2">Notifications</h3>
            <p className="text-sm text-slate-500">Notification preferences coming soon.</p>
          </section>
        )}

        {/* ── Connected accounts ── */}
        {activeSection === "accounts" && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-4">Connected accounts</h3>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {/* Gmail icon */}
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 10.5h39v27h-39z" fill="#fff" />
                <path d="M4.5 10.5 24 25.5l19.5-15" stroke="#EA4335" strokeWidth="2" />
                <path d="M4.5 10.5v27h39v-27L24 25.5 4.5 10.5Z" fill="#fff" stroke="#DADCE0" strokeWidth="1.5" />
                <path d="M4.5 10.5 24 25.5l19.5-15" stroke="#EA4335" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm">Gmail</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Connected
              </span>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
