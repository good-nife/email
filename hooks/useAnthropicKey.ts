"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "anthropic_api_key"

export function useAnthropicKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null)

  useEffect(() => {
    setApiKeyState(localStorage.getItem(STORAGE_KEY))
  }, [])

  function setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key)
    setApiKeyState(key)
  }

  function clearApiKey() {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState(null)
  }

  return { apiKey, setApiKey, clearApiKey }
}
