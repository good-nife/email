import Anthropic from "@anthropic-ai/sdk"
import { Category, CategorizedEmail, CategorizedThread, Email, Thread } from "@/types"
import { createClaudeMessageWithFallback } from "./claude-models"

function getClient(apiKey: string) {
  return new Anthropic({ apiKey })
}

/** Attempt to parse JSON, trying progressively more aggressive repairs on failure. */
function tryParseJSON<T>(text: string, fallback: T): T {
  // 1. Direct parse
  try { return JSON.parse(text) } catch {}
  // 2. Extract the outermost {...} block and try again
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return fallback
  try { return JSON.parse(m[0]) } catch {}
  // 3. Strip control characters and non-printable ASCII, then retry
  const cleaned = m[0]
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")  // control chars
    .replace(/[""]/g, '"')   // curly double quotes → straight
    .replace(/['']/g, "'")   // curly single quotes → straight (will be escaped next)
    .replace(/'/g, "")       // remove apostrophes that can break JSON strings
    .replace(/—/g, "-")      // em-dash → hyphen
    .replace(/…/g, "...")    // ellipsis → three dots
  try { return JSON.parse(cleaned) } catch {}
  // 4. Last resort: remove the oneLiner fields entirely and parse without them
  const noOneLiner = cleaned.replace(/"oneLiner"\s*:\s*"[^"]*",?/g, "")
  try { return JSON.parse(noOneLiner) } catch {}
  return fallback
}

export async function categorizeEmails(
  apiKey: string,
  emails: Email[],
  existingCategories: string[] = []
): Promise<CategorizedEmail[]> {
  if (emails.length === 0) return []
  const client = getClient(apiKey)

  const emailList = emails
    .map((e, i) => `${i}. From: ${e.from} | Subject: ${e.subject} | Snippet: ${e.snippet}`)
    .join("\n")

  const categoryInstruction = existingCategories.length > 0
    ? `Assign each email to one of these existing categories: ${existingCategories.map((c) => `"${c}"`).join(", ")}. Only create a new category if an email truly doesn't fit any existing one.`
    : `First decide what 5-8 category names make sense for these specific emails. Use names that are useful and specific to this person's inbox (e.g. "Bank Alerts", "Family", "Package Tracking", "Work — Acme Corp") rather than generic buckets.`

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Look at these emails and organize them into meaningful categories.

${categoryInstruction}

Also assign 2-4 short semantic tags to each email (lowercase, hyphenated if multi-word) describing its topic, sender type, or action required — e.g. "invoice", "follow-up", "shipping", "family", "bank-alert", "newsletter", "action-required".

Emails:
${emailList}

Reply with JSON only, no explanation:
{"categories":["Cat1","Cat2",...],"assignments":[{"index":0,"category":"Cat1","tags":["tag1","tag2"]},{"index":1,"category":"Cat2","tags":["tag3"]},...]}`,
        },
      ],
    }
  )

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  const result: { categories: string[]; assignments: { index: number; category: string; tags: string[] }[] } =
    tryParseJSON(text, { categories: [], assignments: [] })

  return emails.map((email, i) => {
    const assignment = result.assignments.find((a) => a.index === i)
    return {
      ...email,
      category: assignment?.category ?? "Other",
      tags: assignment?.tags ?? [],
    }
  })
}

export async function categorizeThreads(
  apiKey: string,
  threads: Thread[],
  existingCategories: string[] = []
): Promise<CategorizedThread[]> {
  if (threads.length === 0) return []
  const client = getClient(apiKey)

  const threadList = threads
    .map((t, i) =>
      `${i}. Subject: ${t.subject} | From: ${t.participants.slice(0, 3).join(", ")} | Messages: ${t.messageCount} | Preview: ${t.snippet.slice(0, 120)}`
    )
    .join("\n")

  const categoryInstruction =
    existingCategories.length > 0
      ? `Assign each conversation to one of these existing categories: ${existingCategories.map((c) => `"${c}"`).join(", ")}. Only create a new category if a conversation truly doesn't fit any existing one.`
      : `First decide what 5-8 category names make sense for these conversations. Use names specific to this inbox (e.g. "Bank Alerts", "Family", "Work — Acme Corp") rather than generic buckets.`

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Look at these email conversations and organize them into meaningful categories.

${categoryInstruction}

Also assign 2-4 short semantic tags to each conversation (lowercase, hyphenated if multi-word).

Also write a "oneLiner" for each: a single clean sentence (max 12 words) summarising what the thread is about. Rules: plain English only, no quotes, no apostrophes, no em-dashes, no special characters — use only basic ASCII letters, numbers, spaces, commas, and periods.

Conversations:
${threadList}

Reply with JSON only, no explanation:
{"categories":["Cat1","Cat2",...],"assignments":[{"index":0,"category":"Cat1","tags":["tag1","tag2"],"oneLiner":"Brief one-sentence summary."},{"index":1,"category":"Cat2","tags":["tag3"],"oneLiner":"Another summary."},...]}`,
        },
      ],
    }
  )

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  const result: { categories: string[]; assignments: { index: number; category: string; tags: string[]; oneLiner?: string }[] } =
    tryParseJSON(text, { categories: [], assignments: [] })

  return threads.map((thread, i) => {
    const assignment = result.assignments.find((a) => a.index === i)
    return {
      ...thread,
      category: assignment?.category ?? "Other",
      tags: assignment?.tags ?? [],
      oneLiner: assignment?.oneLiner ?? undefined,
    }
  })
}

export async function draftReply(
  apiKey: string,
  thread: Thread,
  sentEmails: Email[],
  categoryThreads: Thread[] = [],
  extraContext = "",
  scope: "latest" | "full" = "full"
): Promise<string> {
  const client = getClient(apiKey)

  const voiceSamples = sentEmails
    .filter((e) => e.body.trim().length > 20)
    .slice(0, 8)
    .map((e) => `---\n${e.body.trim()}`)
    .join("\n")

  const threadHistory = thread.messages
    .map((m) => `From: ${m.from}\n${m.body.trim()}`)
    .join("\n\n---\n\n")

  const categoryContext = categoryThreads
    .filter((t) => t.id !== thread.id)
    .slice(0, 8)
    .map((t) => `Subject: ${t.subject}\nPreview: ${(t.snippet || t.messages[0]?.body.trim() || "").slice(0, 200)}`)
    .join("\n\n")

  const scopeInstruction = scope === "latest"
    ? "You are helping someone write a quick, focused reply to the single most recent email in a conversation. Respond ONLY to what that latest message says — its specific question, request, or point. Do not reference or summarise earlier messages in the thread. Keep the reply concise and direct."
    : "You are helping someone write a considered reply to an ongoing email conversation. You have the full thread history — use the accumulated context, prior agreements, decisions, and the evolving tone to craft a reply that is coherent with everything discussed so far. Acknowledge relevant history where appropriate."

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${scopeInstruction}

Study this person's writing style from past emails they sent:

${voiceSamples}
${categoryContext ? `\nFor additional context, here are some other related emails:\n${categoryContext}\n` : ""}
${extraContext ? `\nThe user wants this reply to specifically cover: ${extraContext}\n` : ""}
Now write the reply. Match their tone, length, and style exactly — use similar greetings, sign-offs, and phrasing patterns. Only return the email body text, no subject line.

${scope === "latest" ? "Latest message to reply to" : "Full conversation thread"}:
${threadHistory}`,
        },
      ],
    }
  )

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function draftNewEmail(
  apiKey: string,
  to: string,
  subject: string,
  context: string,
  sentEmails: Email[],
  categoryThreads: Thread[] = []
): Promise<string> {
  const client = getClient(apiKey)

  const voiceSamples = sentEmails
    .filter((e) => e.body.trim().length > 20)
    .slice(0, 8)
    .map((e) => `---\n${e.body.trim()}`)
    .join("\n")

  const categoryContext = categoryThreads
    .slice(0, 8)
    .map((t) => `Subject: ${t.subject}\nPreview: ${(t.snippet || t.messages[0]?.body.trim() || "").slice(0, 200)}`)
    .join("\n\n")

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are helping someone write an email. Study their writing style from these past emails they sent:

${voiceSamples}
${categoryContext ? `\nFor topical context, here are some recent related emails:\n${categoryContext}\n` : ""}
Write a new email with:
- To: ${to}
- Subject: ${subject}
${context ? `- Context/notes: ${context}` : ""}

Match their tone, length, and style. Only return the email body text, no subject line.`,
        },
      ],
    }
  )

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function summarizeThread(
  apiKey: string,
  thread: Thread,
  messageCount: number | "all"
): Promise<string> {
  const client = getClient(apiKey)

  const messages = messageCount === "all"
    ? thread.messages
    : thread.messages.slice(-messageCount)

  const formatted = messages
    .map((m) => `From: ${m.from}\n${m.body.trim() || m.snippet}`)
    .join("\n\n---\n\n")

  const scope = messageCount === "all"
    ? "the entire thread"
    : messageCount === 1
    ? "the latest message"
    : `the last ${messageCount} messages`

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Summarize ${scope} of this email thread concisely. Cover the key points, any requests or action items, and the overall tone. 3-5 sentences max.

Thread subject: ${thread.subject}

${formatted}`,
        },
      ],
    }
  )

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function translateToGmailQuery(
  apiKey: string,
  naturalLanguageQuery: string
): Promise<string> {
  const client = getClient(apiKey)

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content: `Convert this natural language email search request into a Gmail search query. Return only the Gmail search query, nothing else — no explanation, no quotes around it.

Gmail search supports: keywords, from:, to:, subject:, OR, -, has:attachment, is:unread, after:YYYY/MM/DD, before:YYYY/MM/DD

Examples:
"emails about hiring contractors" → contractor OR hiring OR freelance OR "independent contractor"
"messages from John about the budget" → from:john budget
"invoices I received last year" → subject:invoice after:2025/01/01 before:2026/01/01
"unread emails about the website" → is:unread website

Request: ${naturalLanguageQuery}`,
        },
      ],
    }
  )

  return message.content[0].type === "text" ? message.content[0].text.trim() : naturalLanguageQuery
}

export async function searchCategoryThreads(
  apiKey: string,
  threads: Thread[],
  query: string
): Promise<string> {
  const client = getClient(apiKey)

  const threadSummaries = threads
    .slice(0, 40)
    .map((t) => {
      const msgs = t.messages
        .map((m) => `[${m.from}]: ${m.body.trim().slice(0, 20000)}`)
        .join("\n")
      return `Subject: ${t.subject}\n${msgs}`
    })
    .join("\n\n===\n\n")

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `The user is searching within a set of their email conversations for: "${query}"

Based on the email threads below, write a helpful response. If the request asks to find/filter/list conversations matching certain criteria (e.g. numeric thresholds, specific terms), go through the threads one by one, check each against every criterion, and list each match by name/subject along with the specific values or quotes that satisfy the criteria. If a thread doesn't have enough information to evaluate a criterion, note that rather than guessing. Otherwise, surface the most relevant conversations and answer any question that was asked. If nothing matches, say so plainly.

Email threads:
${threadSummaries}

Write a clear response in plain prose, using a short list for multiple matches.`,
        },
      ],
    }
  )

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function summarizeCorrespondence(
  apiKey: string,
  threads: Thread[],
  personQuery: string
): Promise<string> {
  const client = getClient(apiKey)

  const threadSummaries = threads
    .slice(0, 10)
    .map((t) => {
      const msgs = t.messages
        .map((m) => `[${m.from}]: ${m.body.trim().slice(0, 3000)}`)
        .join("\n")
      return `Subject: ${t.subject}\n${msgs}`
    })
    .join("\n\n===\n\n")

  const message = await createClaudeMessageWithFallback(
    (params) => client.messages.create(params),
    {
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Summarize the email correspondence with "${personQuery}". Cover:
1. Main topics discussed
2. Key decisions or outcomes
3. Any open/unresolved items
4. Overall tone/relationship

Email threads:
${threadSummaries}

Write a clear, concise summary in plain prose (3-5 paragraphs).`,
        },
      ],
    }
  )

  return message.content[0].type === "text" ? message.content[0].text : ""
}
