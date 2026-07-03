import crypto from "crypto"
import { readCacheMap, writeCacheMap } from "./cache"

/** Builds a stable cache key from the pieces that determine a Claude response's output. */
export function responseCacheKey(parts: (string | number | undefined)[]): string {
  return crypto.createHash("sha256").update(parts.map((p) => p ?? "").join("|")).digest("hex")
}

export function getCachedResponse(userEmail: string, prefix: string, key: string): string | null {
  const cache = readCacheMap<string>(userEmail, prefix)
  return cache?.emails[key] ?? null
}

export function setCachedResponse(userEmail: string, prefix: string, key: string, value: string): void {
  const cache = readCacheMap<string>(userEmail, prefix)
  const data = cache ? { ...cache.emails } : {}
  data[key] = value
  writeCacheMap(userEmail, data, prefix)
}
