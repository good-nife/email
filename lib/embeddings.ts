import { CategorizedThread, Thread } from "@/types"
import { readCacheMap, writeCacheMap } from "./cache"

const VOYAGE_MODEL = "voyage-3.5"
const EMBEDDING_CACHE_PREFIX = "embeddings"

export function embeddingsConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY)
}

async function embed(inputs: string[], inputType: "query" | "document"): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error("VOYAGE_API_KEY not configured")

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: inputs, input_type: inputType }),
  })

  if (!res.ok) {
    throw new Error(`Voyage embeddings request failed: ${res.status} ${await res.text()}`)
  }

  const data: { data: { embedding: number[]; index: number }[] } = await res.json()
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

function threadEmbeddingText(t: Thread): string {
  return `${t.subject}\n${t.snippet}`.slice(0, 2000)
}

/**
 * Ranks threads by semantic similarity to the query using cached Voyage AI embeddings,
 * so downstream Claude calls only need the top-K most relevant threads instead of the
 * full set. Falls back to returning the first `topK` threads unchanged if Voyage isn't
 * configured or there aren't enough threads to bother ranking.
 */
export async function rankThreadsByRelevance(
  userEmail: string,
  threads: Thread[],
  query: string,
  topK: number
): Promise<{ threads: Thread[]; ranked: boolean }> {
  if (!embeddingsConfigured() || threads.length <= topK) {
    return { threads: threads.slice(0, topK), ranked: false }
  }

  try {
    const cache = readCacheMap<number[]>(userEmail, EMBEDDING_CACHE_PREFIX)
    const cached = cache ? { ...cache.emails } : {}

    const missing = threads.filter((t) => !cached[t.id])
    if (missing.length > 0) {
      const vectors = await embed(missing.map(threadEmbeddingText), "document")
      missing.forEach((t, i) => {
        cached[t.id] = vectors[i]
      })
      writeCacheMap(userEmail, cached, EMBEDDING_CACHE_PREFIX)
    }

    const [queryVector] = await embed([query], "query")

    const ranked = threads
      .map((t) => ({ thread: t, score: cosineSimilarity(queryVector, cached[t.id]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => r.thread)

    return { threads: ranked, ranked: true }
  } catch (err) {
    console.error("[embeddings] ranking failed, falling back to unranked threads:", err)
    return { threads: threads.slice(0, topK), ranked: false }
  }
}

const SIMILARITY_THRESHOLD = 0.85

/**
 * Pre-classifies new threads by embedding similarity against already-categorized threads,
 * avoiding Claude calls for threads that closely resemble ones we've seen before.
 *
 * On the first call it also bootstraps embeddings for any already-categorized threads that
 * don't have them yet, so the reference set is immediately useful.
 *
 * Falls back to returning all threads as "uncertain" (→ Claude) if Voyage isn't configured
 * or anything goes wrong.
 */
export async function classifyThreadsByEmbedding(
  userEmail: string,
  newThreads: Thread[],
  categorizedRef: CategorizedThread[],
  threshold = SIMILARITY_THRESHOLD
): Promise<{ certain: CategorizedThread[]; uncertain: Thread[] }> {
  if (!embeddingsConfigured() || newThreads.length === 0) {
    return { certain: [], uncertain: newThreads }
  }

  try {
    const embCache = readCacheMap<number[]>(userEmail, EMBEDDING_CACHE_PREFIX)
    const embeddings = embCache ? { ...embCache.emails } : {}

    // Bootstrap: embed any already-categorized threads that are missing vectors
    const missingRefs = categorizedRef.filter((t) => !embeddings[t.id])
    if (missingRefs.length > 0) {
      const vectors = await embed(missingRefs.map(threadEmbeddingText), "document")
      missingRefs.forEach((t, i) => { embeddings[t.id] = vectors[i] })
    }

    // Embed new threads and store everything
    const newVectors = await embed(newThreads.map(threadEmbeddingText), "document")
    newThreads.forEach((t, i) => { embeddings[t.id] = newVectors[i] })
    writeCacheMap(userEmail, embeddings, EMBEDDING_CACHE_PREFIX)

    // Build reference set: categorized threads that now have embeddings
    const refs = categorizedRef
      .filter((t) => embeddings[t.id])
      .map((t) => ({ category: t.category, tags: t.tags, embedding: embeddings[t.id] }))

    if (refs.length === 0) return { certain: [], uncertain: newThreads }

    const certain: CategorizedThread[] = []
    const uncertain: Thread[] = []

    newThreads.forEach((thread, i) => {
      const vec = newVectors[i]
      let bestSim = -1
      let bestRef: (typeof refs)[0] | null = null
      for (const ref of refs) {
        const sim = cosineSimilarity(vec, ref.embedding)
        if (sim > bestSim) { bestSim = sim; bestRef = ref }
      }
      if (bestSim >= threshold && bestRef) {
        certain.push({ ...thread, category: bestRef.category, tags: bestRef.tags ?? [] })
      } else {
        uncertain.push(thread)
      }
    })

    return { certain, uncertain }
  } catch (err) {
    console.error("[embeddings] classifyThreadsByEmbedding failed, falling back to Claude:", err)
    return { certain: [], uncertain: newThreads }
  }
}
