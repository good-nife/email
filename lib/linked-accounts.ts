import fs from "fs"
import path from "path"

const CACHE_DIR = path.join(process.cwd(), ".cache")

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function accountsFile(primaryEmail: string) {
  const safe = primaryEmail.replace(/[^a-z0-9]/gi, "_")
  return path.join(CACHE_DIR, `linked-accounts-${safe}.json`)
}

function stateFile(nonce: string) {
  return path.join(CACHE_DIR, `oauth-state-${nonce}.json`)
}

export interface LinkedAccount {
  email: string
  name: string
  picture?: string
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix seconds
}

export interface LinkedAccountPublic {
  email: string
  name: string
  picture?: string
}

export interface OAuthState {
  primaryEmail: string
  expiresAt: number // ms
}

// ── Storage ─────────────────────────────────────────────────────────────────

export function readLinkedAccounts(primaryEmail: string): LinkedAccount[] {
  try {
    const file = accountsFile(primaryEmail)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, "utf-8")).accounts ?? []
  } catch {
    return []
  }
}

export function writeLinkedAccounts(primaryEmail: string, accounts: LinkedAccount[]): void {
  ensureDir()
  fs.writeFileSync(accountsFile(primaryEmail), JSON.stringify({ accounts }), "utf-8")
}

export function addLinkedAccount(primaryEmail: string, account: LinkedAccount): void {
  const accounts = readLinkedAccounts(primaryEmail).filter((a) => a.email !== account.email)
  writeLinkedAccounts(primaryEmail, [...accounts, account])
}

export function removeLinkedAccount(primaryEmail: string, email: string): void {
  writeLinkedAccounts(
    primaryEmail,
    readLinkedAccounts(primaryEmail).filter((a) => a.email !== email)
  )
}

// ── OAuth state nonces ───────────────────────────────────────────────────────

export function saveOAuthState(nonce: string, state: OAuthState): void {
  ensureDir()
  fs.writeFileSync(stateFile(nonce), JSON.stringify(state), "utf-8")
}

export function consumeOAuthState(nonce: string): OAuthState | null {
  const file = stateFile(nonce)
  try {
    if (!fs.existsSync(file)) return null
    const data = JSON.parse(fs.readFileSync(file, "utf-8")) as OAuthState
    fs.unlinkSync(file)
    if (data.expiresAt < Date.now()) return null
    return data
  } catch {
    return null
  }
}

// ── Token refresh ────────────────────────────────────────────────────────────

export async function getFreshAccessToken(
  primaryEmail: string,
  account: LinkedAccount
): Promise<string> {
  if (Date.now() < account.expiresAt * 1000 - 60_000) return account.accessToken

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed for ${account.email}: ${await res.text()}`)

  const data = await res.json()
  const refreshed: LinkedAccount = {
    ...account,
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    refreshToken: data.refresh_token ?? account.refreshToken,
  }

  // Persist the refreshed token
  const accounts = readLinkedAccounts(primaryEmail).filter((a) => a.email !== account.email)
  writeLinkedAccounts(primaryEmail, [...accounts, refreshed])

  return refreshed.accessToken
}
