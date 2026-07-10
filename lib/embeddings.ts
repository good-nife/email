import { CategorizedThread, Thread } from "@/types"
import { prisma } from "./prisma"
import { UsageOptions } from "./user"

type OnUsage = (opts: UsageOptions) => void

const VOYAGE_MODEL = "voyage-3.5"
const SIMILARITY_THRESHOLD = 0.85

export function embeddingsConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY)
}

async function embed(
  inputs: string[],
  inputType: "query" | "document",
  onUsage?: OnUsage
): Promise<number[][]> {
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

  const data: { data: { embedding: number[]; index: number }[]; usage: { total_tokens: number } } = await res.json()
  onUsage?.({ provider: "voyage", model: VOYAGE_MODEL, inputTokens: data.usage?.total_tokens })
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
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

async function getStoredEmbeddings(userEmail: string): Promise<Record<string, number[]>> {
  const rows = await prisma.embedding.findMany({ where: { userEmail } })
  const result: Record<string, number[]> = {}
  for (const row of rows) result[row.threadId] = row.vector
  return result
}

async function saveEmbeddings(userEmail: string, newEmbeddings: Record<string, number[]>): Promise<void> {
  await Promise.all(
    Object.entries(newEmbeddings).map(([threadId, vector]) =>
      prisma.embedding.upsert({
        where: { userEmail_threadId: { userEmail, threadId } },
        update: { vector },
        create: { userEmail, threadId, vector },
      })
    )
  )
}

export async function rankThreadsByRelevance(
  userEmail: string,
  threads: Thread[],
  query: string,
  topK: number,
  onUsage?: OnUsage
): Promise<{ threads: Thread[]; ranked: boolean }> {
  if (!embeddingsConfigured() || threads.length <= topK) {
    return { threads: threads.slice(0, topK), ranked: false }
  }

  try {
    const stored = await getStoredEmbeddings(userEmail)
    const missing = threads.filter((t) => !stored[t.id])

    if (missing.length > 0) {
      const vectors = await embed(missing.map(threadEmbeddingText), "document", onUsage)
      const newEmbeddings: Record<string, number[]> = {}
      missing.forEach((t, i) => { newEmbeddings[t.id] = vectors[i]; stored[t.id] = vectors[i] })
      await saveEmbeddings(userEmail, newEmbeddings)
    }

    const [queryVector] = await embed([query], "query", onUsage)

    const ranked = threads
      .map((t) => ({ thread: t, score: cosineSimilarity(queryVector, stored[t.id]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => r.thread)

    return { threads: ranked, ranked: true }
  } catch (err) {
    console.error("[embeddings] ranking failed, falling back to unranked threads:", err)
    return { threads: threads.slice(0, topK), ranked: false }
  }
}

export async function classifyThreadsByEmbedding(
  userEmail: string,
  newThreads: Thread[],
  categorizedRef: CategorizedThread[],
  threshold = SIMILARITY_THRESHOLD,
  onUsage?: OnUsage
): Promise<{ certain: CategorizedThread[]; uncertain: Thread[] }> {
  if (!embeddingsConfigured() || newThreads.length === 0) {
    return { certain: [], uncertain: newThreads }
  }

  try {
    const stored = await getStoredEmbeddings(userEmail)

    // Bootstrap: embed any already-categorized threads missing vectors
    const missingRefs = categorizedRef.filter((t) => !stored[t.id])
    if (missingRefs.length > 0) {
      const vectors = await embed(missingRefs.map(threadEmbeddingText), "document", onUsage)
      missingRefs.forEach((t, i) => { stored[t.id] = vectors[i] })
    }

    // Embed new threads
    const newVectors = await embed(newThreads.map(threadEmbeddingText), "document", onUsage)
    const toSave: Record<string, number[]> = {}
    newThreads.forEach((t, i) => { stored[t.id] = newVectors[i]; toSave[t.id] = newVectors[i] })
    if (missingRefs.length > 0) {
      missingRefs.forEach((t) => { toSave[t.id] = stored[t.id] })
    }
    await saveEmbeddings(userEmail, toSave)

    const refs = categorizedRef
      .filter((t) => stored[t.id])
      .map((t) => ({ category: t.category, tags: t.tags, embedding: stored[t.id] }))

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
