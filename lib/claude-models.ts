type ClaudeErrorLike = {
  status?: number
  message?: string
  error?: {
    type?: string
    message?: string
  }
}

type ClaudeMessageRole = "user" | "assistant" | "system"

type ClaudeMessageParams = {
  model?: string
  max_tokens: number
  messages: Array<{ role: ClaudeMessageRole; content: string }>
}

type ClaudeCreateMessage = (params: any) => Promise<any>

export function getClaudeModelCandidates(env: NodeJS.ProcessEnv = process.env, preferredModel?: string) {
  const configured = (preferredModel || env.ANTHROPIC_MODEL || "").trim()
  const ordered = configured ? [configured] : []
  const fallbacks = [
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-sonnet-4-5",
  ]

  return [...new Set([...ordered, ...fallbacks])]
}

export function shouldRetryWithNextModel(error: unknown) {
  const candidate = error as ClaudeErrorLike | null
  const status = candidate?.status
  const message = [candidate?.message, candidate?.error?.message, candidate?.error?.type]
    .filter(Boolean)
    .join(" ")

  if (status && [400, 404, 422].includes(status)) {
    return true
  }

  return Boolean(message && /model|not found|does not exist|invalid|unsupported/i.test(message))
}

export async function createClaudeMessageWithFallback(
  createMessage: ClaudeCreateMessage,
  params: ClaudeMessageParams
) {
  const candidates = getClaudeModelCandidates(process.env, params.model)
  let lastError: unknown

  for (const model of candidates) {
    try {
      return await createMessage({ ...params, model })
    } catch (error) {
      lastError = error
      if (!shouldRetryWithNextModel(error)) {
        throw error
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error("Anthropic request failed")
}
