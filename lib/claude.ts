import Anthropic from "@anthropic-ai/sdk"
import { Category, CategorizedEmail, Email, Thread } from "@/types"

function getClient(apiKey: string) {
  return new Anthropic({ apiKey })
}

export async function categorizeEmails(
  apiKey: string,
  emails: Email[]
): Promise<CategorizedEmail[]> {
  const client = getClient(apiKey)

  const emailList = emails
    .map((e, i) => `${i}. From: ${e.from} | Subject: ${e.subject} | Snippet: ${e.snippet}`)
    .join("\n")

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Look at these emails and organize them into meaningful categories that reflect what's actually in this inbox.

First decide what 5-8 category names make sense for these specific emails. Use names that are useful and specific to this person's inbox (e.g. "Bank Alerts", "Family", "Package Tracking", "Work — Acme Corp") rather than generic buckets.

Then assign each email to one of your chosen categories.

Emails:
${emailList}

Reply with JSON only, no explanation:
{"categories":["Cat1","Cat2",...],"assignments":[{"index":0,"category":"Cat1"},{"index":1,"category":"Cat2"},...]}`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const result: { categories: string[]; assignments: { index: number; category: string }[] } =
    jsonMatch ? JSON.parse(jsonMatch[0]) : { categories: [], assignments: [] }

  return emails.map((email, i) => ({
    ...email,
    category: result.assignments.find((a) => a.index === i)?.category ?? "Other",
  }))
}

export async function draftReply(
  apiKey: string,
  thread: Thread,
  sentEmails: Email[]
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

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are helping someone write an email reply. Study their writing style from these past emails they sent:

${voiceSamples}

Now write a reply to this email thread. Match their tone, length, and style exactly — use similar greetings, sign-offs, and phrasing patterns. Only return the email body text, no subject line.

Thread to reply to:
${threadHistory}`,
      },
    ],
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function draftNewEmail(
  apiKey: string,
  to: string,
  subject: string,
  context: string,
  sentEmails: Email[]
): Promise<string> {
  const client = getClient(apiKey)

  const voiceSamples = sentEmails
    .filter((e) => e.body.trim().length > 20)
    .slice(0, 8)
    .map((e) => `---\n${e.body.trim()}`)
    .join("\n")

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are helping someone write an email. Study their writing style from these past emails they sent:

${voiceSamples}

Write a new email with:
- To: ${to}
- Subject: ${subject}
${context ? `- Context/notes: ${context}` : ""}

Match their tone, length, and style. Only return the email body text, no subject line.`,
      },
    ],
  })

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

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Summarize ${scope} of this email thread concisely. Cover the key points, any requests or action items, and the overall tone. 3-5 sentences max.

Thread subject: ${thread.subject}

${formatted}`,
      },
    ],
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function translateToGmailQuery(
  apiKey: string,
  naturalLanguageQuery: string
): Promise<string> {
  const client = getClient(apiKey)

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
  })

  return message.content[0].type === "text" ? message.content[0].text.trim() : naturalLanguageQuery
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
        .map((m) => `[${m.from}]: ${m.body.trim().slice(0, 300)}`)
        .join("\n")
      return `Subject: ${t.subject}\n${msgs}`
    })
    .join("\n\n===\n\n")

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}
