export interface Email {
  id: string
  threadId: string
  subject: string
  from: string
  fromEmail: string
  date: string
  snippet: string
  body: string
  isRead: boolean
  labelIds: string[]
}

export interface Thread {
  id: string
  subject: string
  participants: string[]
  messages: Email[]
  lastDate: string
  snippet: string
  isRead: boolean
  messageCount: number
}

export interface CategorizedThread extends Thread {
  category: string
  tags: string[]
  oneLiner?: string
}

export type Category = string

// Kept for backward compat with draft/search routes
export interface CategorizedEmail extends Email {
  category: Category
  tags: string[]
}
