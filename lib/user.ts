import { prisma } from "./prisma"

export type Plan = "free" | "pro"

export type UsageOptions = {
  provider?: string
  model?: string
  inputTokens?: number
  outputTokens?: number
}

export async function getOrCreateUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  })
}

export async function getUserPlan(email: string): Promise<Plan> {
  const user = await prisma.user.findUnique({ where: { email }, select: { plan: true, subscribedUntil: true } })
  if (!user) return "free"
  if (user.plan === "pro") {
    if (user.subscribedUntil && user.subscribedUntil < new Date()) return "free"
    return "pro"
  }
  return "free"
}

export async function trackUsage(email: string, action: string, options?: UsageOptions) {
  const user = await getOrCreateUser(email)
  await prisma.usageEvent.create({
    data: {
      userId: user.id,
      action,
      provider: options?.provider ?? "anthropic",
      model: options?.model,
      inputTokens: options?.inputTokens,
      outputTokens: options?.outputTokens,
    },
  })
}

export async function getDailyUsageCount(email: string, action: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return 0
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  return prisma.usageEvent.count({
    where: { userId: user.id, action, createdAt: { gte: since } },
  })
}
