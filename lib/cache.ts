import fs from "fs"
import path from "path"

const CACHE_DIR = path.join(process.cwd(), ".cache")

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function cacheFile(userEmail: string, prefix: string) {
  const safe = userEmail.replace(/[^a-z0-9]/gi, "_")
  return path.join(CACHE_DIR, `${prefix}-${safe}.json`)
}

export interface CacheFile<T> {
  updatedAt: string
  emails: Record<string, T>
}

export function readCacheMap<T>(userEmail: string, prefix = "threads"): CacheFile<T> | null {
  try {
    const file = cacheFile(userEmail, prefix)
    if (!fs.existsSync(file)) return null
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"))
    // Migrate old array-based format
    if (Array.isArray(raw.emails)) {
      const map: Record<string, T> = {}
      for (const e of raw.emails) map[e.id] = e
      return { updatedAt: raw.cachedAt ?? new Date().toISOString(), emails: map }
    }
    return raw as CacheFile<T>
  } catch {
    return null
  }
}

export function writeCacheMap<T>(userEmail: string, data: Record<string, T>, prefix = "threads"): void {
  ensureDir()
  fs.writeFileSync(
    cacheFile(userEmail, prefix),
    JSON.stringify({ updatedAt: new Date().toISOString(), emails: data }),
    "utf-8"
  )
}
