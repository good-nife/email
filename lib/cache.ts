import { prisma } from "./prisma"
import { CategorizedThread } from "@/types"

export interface ThreadCacheData {
  emails: Record<string, CategorizedThread>
  updatedAt: string
}

export async function readThreadCache(userEmail: string): Promise<ThreadCacheData | null> {
  const rows = await prisma.threadCategory.findMany({ where: { userEmail } })
  if (rows.length === 0) return null

  const emails: Record<string, CategorizedThread> = {}
  for (const row of rows) {
    emails[row.threadId] = {
      id: row.threadId,
      subject: row.subject,
      participants: row.participants,
      snippet: row.snippet,
      lastDate: row.lastDate,
      isRead: row.isRead,
      messageCount: row.messageCount,
      messages: [],
      category: row.category,
      tags: row.tags,
      oneLiner: row.oneLiner ?? undefined,
    }
  }

  const updatedAt = rows.reduce((latest, r) => {
    const t = r.updatedAt.toISOString()
    return t > latest ? t : latest
  }, new Date(0).toISOString())

  return { emails, updatedAt }
}

export async function writeThreadCache(userEmail: string, data: Record<string, CategorizedThread>): Promise<void> {
  await Promise.all(
    Object.values(data).map((thread) =>
      prisma.threadCategory.upsert({
        where: { userEmail_threadId: { userEmail, threadId: thread.id } },
        update: {
          subject: thread.subject,
          participants: thread.participants,
          snippet: thread.snippet,
          lastDate: thread.lastDate,
          isRead: thread.isRead,
          messageCount: thread.messageCount,
          category: thread.category,
          tags: thread.tags,
          oneLiner: thread.oneLiner,
        },
        create: {
          userEmail,
          threadId: thread.id,
          subject: thread.subject,
          participants: thread.participants,
          snippet: thread.snippet,
          lastDate: thread.lastDate,
          isRead: thread.isRead,
          messageCount: thread.messageCount,
          category: thread.category,
          tags: thread.tags,
          oneLiner: thread.oneLiner,
        },
      })
    )
  )
}

export async function clearThreadCache(userEmail: string): Promise<void> {
  await prisma.threadCategory.deleteMany({ where: { userEmail } })
}
