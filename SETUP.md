# Mail Assistant — Setup Guide

## What you need

- [Node.js](https://nodejs.org) (v18 or later)
- A Google account (Gmail)
- An [Anthropic API key](https://console.anthropic.com)

---

## Step 1 — Get Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or pick an existing one)
3. Go to **APIs & Services → Library**, search for **Gmail API**, click it, and click **Enable**
4. Go to **APIs & Services → OAuth consent screen**
   - Choose **External** → fill in App name (e.g. "Mail Assistant"), your email, and save
   - Under **Scopes**, add:
     - `gmail.readonly`
     - `gmail.send`
     - `gmail.modify`
   - Under **Test users**, add your Gmail address
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Click **Create**
6. Copy the **Client ID** and **Client Secret**

---

## Step 2 — Configure the app

1. In this folder, copy `.env.local.example` to `.env.local`:
   ```
   copy .env.local.example .env.local
   ```
2. Open `.env.local` and fill in:
   - `GOOGLE_CLIENT_ID` — from Step 1
   - `GOOGLE_CLIENT_SECRET` — from Step 1
   - `NEXTAUTH_SECRET` — run this in a terminal to generate one:
     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - Leave `NEXTAUTH_URL=http://localhost:3000` as-is

---

## Step 3 — Install and run

Open a terminal in this folder and run:

```
npm install
npm run dev
```

Then open your browser to **http://localhost:3000**.

---

## Step 4 — Add your Anthropic API key

1. Click **Settings** in the top nav
2. Paste your Anthropic API key (starts with `sk-ant-`)
3. Click **Save**

Your key is stored only in your browser — it never leaves your machine.

---

## Using the app

| Page | What it does |
|------|-------------|
| **Inbox** | Loads your last 40 emails, categorized by AI |
| **Compose** | Write a new email — click "Draft with AI" to get a draft in your voice |
| **Reply** | Click any email in Inbox to open a reply with full thread context |
| **Search** | Type a person's name or email to get a summary of your history with them |
| **Settings** | Manage your API key |

---

## Sharing with a friend via ngrok

ngrok creates a public URL that tunnels to your local machine, so your friend can use the app without you deploying it anywhere.

### One-time setup

1. [Download ngrok](https://ngrok.com/download) and install it
2. Sign up for a free ngrok account and run:
   ```
   ngrok config add-authtoken YOUR_TOKEN
   ```
3. In Google Cloud Console → **Credentials** → your OAuth client → **Edit**:
   - Add a second Authorized redirect URI:
     ```
     https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/auth/callback/google
     ```
   - Free ngrok gives you a **fixed subdomain** (shown in your ngrok dashboard after first run) — add that once and it stays the same

### Each session

Open two terminals:

**Terminal 1** — start the app:
```
npm run dev
```

**Terminal 2** — start ngrok:
```
ngrok http 3000
```

ngrok will show a URL like `https://abc123.ngrok-free.app`. Send that to your friend — they open it in their browser and sign in with their Google account.

> **Note:** The free ngrok URL is stable between sessions once you claim a subdomain in the ngrok dashboard (Account → Your Domains). You don't need to update Google Cloud Console each time.

---

## Notes

- The app only runs while both terminals are open. Close either to stop.
- Your friend signs in with their own Google account — they see their own emails, not yours.
- Your emails are never stored — they're fetched live from Gmail each time.
- To run it permanently without ngrok, deploy to [Vercel](https://vercel.com) (free).
