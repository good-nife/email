import { Thread } from "@/types"
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
