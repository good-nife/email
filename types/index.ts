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
}

export type Category = string

export interface CategorizedEmail extends Email {
  category: Category
  tags: string[]
}
