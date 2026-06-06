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

export interface EmailCache {
  cachedAt: string
  emails: CategorizedEmail[]
}

export function readCache(userEmail: string): EmailCache | null {
  try {
    const file = cacheFile(userEmail)
    if (!fs.existsSync(file)) return null
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

export function writeCache(userEmail: string, emails: CategorizedEmail[]): void {
  ensureDir()
  const data: EmailCache = { cachedAt: new Date().toISOString(), emails }
  fs.writeFileSync(cacheFile(userEmail), JSON.stringify(data), "utf-8")
}
