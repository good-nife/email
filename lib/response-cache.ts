import crypto from "crypto"
import { prisma } from "./prisma"

export function responseCacheKey(parts: (string | number | undefined)[]): string {
  return crypto.createHash("sha256").update(parts.map((p) => p ?? "").join("|")).digest("hex")
}

export async function getCachedResponse(userEmail: string, prefix: string, key: string): Promise<string | null> {
  const row = await prisma.responseCache.findUnique({
    where: { userEmail_prefix_cacheKey: { userEmail, prefix, cacheKey: key } },
  })
  return row?.value ?? null
}

export async function setCachedResponse(userEmail: string, prefix: string, key: string, value: string): Promise<void> {
  await prisma.responseCache.upsert({
    where: { userEmail_prefix_cacheKey: { userEmail, prefix, cacheKey: key } },
    update: { value },
    create: { userEmail, prefix, cacheKey: key, value },
  })
}
