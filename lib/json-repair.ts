function normalizeJsonText(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()
}

function tryParseCandidate<T>(candidate: string, fallback: T): T {
  try {
    return JSON.parse(candidate) as T
  } catch {
    return fallback
  }
}

function extractBalancedJsonCandidate(text: string): string | null {
  const normalized = normalizeJsonText(text)
  if (!normalized) return null

  const start = normalized.indexOf("{")
  if (start < 0) return null

  const stack: string[] = []
  let inString = false
  let escaped = false

  for (let i = start; i < normalized.length; i++) {
    const char = normalized[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === "\\") {
        escaped = true
        continue
      }

      if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === "{" || char === "[") {
      stack.push(char)
      continue
    }

    if (char === "}" || char === "]") {
      if (stack.length === 0) {
        break
      }

      const open = stack.pop()
      if ((char === "}" && open !== "{") || (char === "]" && open !== "[")) {
        break
      }

      if (stack.length === 0) {
        return normalized.slice(start, i + 1)
      }
    }
  }

  let repaired = normalized.slice(start)
  if (inString) {
    repaired += '"'
  }

  const closing: string[] = []
  for (const open of stack.slice().reverse()) {
    closing.push(open === "{" ? "}" : "]")
  }

  if (closing.length > 0) {
    repaired += closing.join("")
  }

  repaired = repaired.replace(/,\s*([}\]])/g, "$1")
  return repaired
}

export function tryParseJSON<T>(text: string, fallback: T): T {
  const normalized = normalizeJsonText(text)
  if (!normalized) return fallback

  const candidates = [normalized]
  const balanced = extractBalancedJsonCandidate(normalized)
  if (balanced) {
    candidates.push(balanced)
  }

  for (const candidate of candidates) {
    const parsed = tryParseCandidate(candidate, fallback)
    if (parsed !== fallback) {
      return parsed
    }
  }

  const noOneLiner = normalized.replace(/"oneLiner"\s*:\s*"[^"]*",?/g, "")
  const parsed = tryParseCandidate(noOneLiner, fallback)
  if (parsed !== fallback) {
    return parsed
  }

  return fallback
}
