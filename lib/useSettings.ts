"use client"

import { useEffect, useState } from "react"

export interface AppSettings {
  defaultTone: "professional" | "friendly" | "concise"
  autoSummarize: boolean
  smartAutoTagging: boolean
  defaultReplyContext: "latest" | "full" | "none"
  signature: string
}

const DEFAULTS: AppSettings = {
  defaultTone: "friendly",
  autoSummarize: true,
  smartAutoTagging: true,
  defaultReplyContext: "full",
  signature: "",
}

const KEY = "clario-settings"

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        setSettingsState({ ...DEFAULTS, ...JSON.parse(raw) })
      }
    } catch {}
    setLoaded(true)
  }, [])

  function setSettings(patch: Partial<AppSettings>) {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { settings, setSettings, loaded }
}
