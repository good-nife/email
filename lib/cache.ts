import fs from "fs"
import path from "path"
import { CategorizedEmail } from "@/types"

const CACHE_DIR = path.join(process.cwd(), ".cache")

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function cacheFile(userEmail: string) {
  const safe = userEmail.replace(/[^a-z0-9]/gi, "_")
  return path.join(CACHE_DIR, `emails-${safe}.json`)
}

export interface EmailCacheFile {
  updatedAt: string
  emails: Record<string, CategorizedEmail>
}

export function readCacheMap(userEmail: string): EmailCacheFile | null {
  try {
    const file = cacheFile(userEmail)
    if (!fs.existsSync(file)) return null
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"))
    // Migrate old array-based format
    if (Array.isArray(raw.emails)) {
      const emailMap: Record<string, CategorizedEmail> = {}
      for (const e of raw.emails) emailMap[e.id] = e
      return { updatedAt: raw.cachedAt ?? new Date().toISOString(), emails: emailMap }
    }
    return raw as EmailCacheFile
  } catch {
    return null
  }
}

export function writeCacheMap(userEmail: string, emails: Record<string, CategorizedEmail>): void {
  ensureDir()
  const data: EmailCacheFile = { updatedAt: new Date().toISOString(), emails }
  fs.writeFileSync(cacheFile(userEmail), JSON.stringify(data), "utf-8")
}
