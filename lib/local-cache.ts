import { CategorizedThread } from "@/types"

const EMAIL_KEY = "clario:email"
const threadsKey = (email: string) => `clario:threads:${email}`

export function getLocalUserEmail(): string | null {
  try { return localStorage.getItem(EMAIL_KEY) } catch { return null }
}

export function readLocalThreadCache(userEmail: string): Record<string, CategorizedThread> {
  try {
    const raw = localStorage.getItem(threadsKey(userEmail))
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function writeLocalThreadCache(userEmail: string, threads: Record<string, CategorizedThread>): void {
  try {
    localStorage.setItem(EMAIL_KEY, userEmail)
    localStorage.setItem(threadsKey(userEmail), JSON.stringify(threads))
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

export function clearLocalThreadCache(userEmail: string): void {
  try {
    localStorage.removeItem(threadsKey(userEmail))
  } catch {}
}
