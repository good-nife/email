import { google } from "googleapis"
import { Email, Thread } from "@/types"

function getGmailClient(accessToken: string) {
  const oauth2 = new google.auth.OAuth2()
  oauth2.setCredentials({ access_token: accessToken })
  return google.gmail({ version: "v1", auth: oauth2 })
}

function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}

function extractBody(payload: any): string {
  if (!payload) return ""

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64(payload.body.data)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain")
    if (plain?.body?.data) return decodeBase64(plain.body.data)

    const html = payload.parts.find((p: any) => p.mimeType === "text/html")
    if (html?.body?.data)
      return decodeBase64(html.body.data)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()

    for (const part of payload.parts) {
      const body = extractBody(part)
      if (body) return body
    }
  }

  return ""
}

function parseHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
}

function parseEmail(msg: any): Email {
  const headers = msg.payload?.headers ?? []
  const fromRaw = parseHeader(headers, "from")
  const emailMatch = fromRaw.match(/<(.+?)>/)
  const fromEmail = emailMatch ? emailMatch[1] : fromRaw
  const from = fromRaw.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "") || fromEmail

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: parseHeader(headers, "subject") || "(no subject)",
    from,
    fromEmail,
    date: parseHeader(headers, "date"),
    snippet: msg.snippet ?? "",
    body: extractBody(msg.payload),
    isRead: !(msg.labelIds ?? []).includes("UNREAD"),
    labelIds: msg.labelIds ?? [],
  }
}

function parseThread(data: any): Thread {
  const messages = (data.messages ?? []).map(parseEmail)
  const subject = messages[0]?.subject ?? "(no subject)"
  return {
    id: data.id!,
    subject,
    participants: [...new Set<string>(messages.map((m: Email) => m.from))],
    messages,
    lastDate: messages[messages.length - 1]?.date ?? "",
    snippet: data.snippet ?? "",
    isRead: messages.every((m: Email) => m.isRead),
    messageCount: messages.length,
  }
}

// --- Thread-based inbox ---

export async function listThreadIds(accessToken: string, maxResults = 40): Promise<string[]> {
  const gmail = getGmailClient(accessToken)
  const { data } = await gmail.users.threads.list({
    userId: "me",
    maxResults,
    labelIds: ["INBOX"],
  })
  return (data.threads ?? []).map((t) => t.id!)
}

export async function fetchThreadsByIds(accessToken: string, ids: string[]): Promise<Thread[]> {
  if (ids.length === 0) return []
  const gmail = getGmailClient(accessToken)
  const results = await Promise.all(
    ids.map((id) => gmail.users.threads.get({ userId: "me", id, format: "full" }))
  )
  return results.map((r) => parseThread(r.data))
}

// --- Single thread (for summarize / draft routes) ---

export async function getThread(accessToken: string, threadId: string): Promise<Thread> {
  const gmail = getGmailClient(accessToken)
  const { data } = await gmail.users.threads.get({ userId: "me", id: threadId, format: "full" })
  return parseThread(data)
}

// --- Sent ---

export async function getSentEmails(accessToken: string, maxResults = 30): Promise<Email[]> {
  const gmail = getGmailClient(accessToken)

  const { data } = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    labelIds: ["SENT"],
  })

  if (!data.messages?.length) return []

  const messages = await Promise.all(
    data.messages.map((m) =>
      gmail.users.messages.get({ userId: "me", id: m.id!, format: "full" })
    )
  )

  return messages.map((r) => parseEmail(r.data))
}

// --- Search ---

export async function searchThreads(accessToken: string, query: string): Promise<Thread[]> {
  const gmail = getGmailClient(accessToken)

  const { data } = await gmail.users.threads.list({
    userId: "me",
    q: query,
    maxResults: 20,
  })

  if (!data.threads?.length) return []

  const results = await Promise.all(
    data.threads.map((t) =>
      gmail.users.threads.get({ userId: "me", id: t.id!, format: "full" })
    )
  )

  return results.map((r) => parseThread(r.data))
}

// --- Send ---

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<void> {
  const gmail = getGmailClient(accessToken)

  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ]

  const raw = Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, ...(threadId ? { threadId } : {}) },
  })
}
