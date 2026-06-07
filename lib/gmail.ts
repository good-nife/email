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

  // Plain text directly in body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // HTML fallback
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64(payload.body.data)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Multipart — prefer plain text part
  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain")
    if (plain?.body?.data) return decodeBase64(plain.body.data)

    const html = payload.parts.find((p: any) => p.mimeType === "text/html")
    if (html?.body?.data)
      return decodeBase64(html.body.data)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()

    // Recurse into nested multipart
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

export async function listEmailIds(accessToken: string, maxResults = 40): Promise<string[]> {
  const gmail = getGmailClient(accessToken)
  const { data } = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    labelIds: ["INBOX"],
  })
  return (data.messages ?? []).map((m) => m.id!)
}

export async function fetchEmailsByIds(accessToken: string, ids: string[]): Promise<Email[]> {
  if (ids.length === 0) return []
  const gmail = getGmailClient(accessToken)
  const messages = await Promise.all(
    ids.map((id) => gmail.users.messages.get({ userId: "me", id, format: "full" }))
  )
  return messages.map((r) => parseEmail(r.data))
}

export async function listEmails(accessToken: string, maxResults = 30): Promise<Email[]> {
  const ids = await listEmailIds(accessToken, maxResults)
  return fetchEmailsByIds(accessToken, ids)
}

export async function getThread(accessToken: string, threadId: string): Promise<Thread> {
  const gmail = getGmailClient(accessToken)
  const { data } = await gmail.users.threads.get({ userId: "me", id: threadId, format: "full" })

  const messages = (data.messages ?? []).map(parseEmail)
  const subject = messages[0]?.subject ?? "(no subject)"
  const participants = [...new Set(messages.map((m) => m.from))]

  return {
    id: data.id!,
    subject,
    participants,
    messages,
    lastDate: messages[messages.length - 1]?.date ?? "",
    snippet: data.snippet ?? "",
  }
}

export async function getSentEmails(accessToken: string, maxResults = 15): Promise<Email[]> {
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

export async function searchThreads(accessToken: string, query: string): Promise<Thread[]> {
  const gmail = getGmailClient(accessToken)

  const { data } = await gmail.users.threads.list({
    userId: "me",
    q: query,
    maxResults: 20,
  })

  if (!data.threads?.length) return []

  const threads = await Promise.all(
    data.threads.map((t) =>
      gmail.users.threads.get({ userId: "me", id: t.id!, format: "full" })
    )
  )

  return threads.map((r) => {
    const messages = (r.data.messages ?? []).map(parseEmail)
    const subject = messages[0]?.subject ?? "(no subject)"
    return {
      id: r.data.id!,
      subject,
      participants: [...new Set(messages.map((m) => m.from))],
      messages,
      lastDate: messages[messages.length - 1]?.date ?? "",
      snippet: r.data.snippet ?? "",
    }
  })
}

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
