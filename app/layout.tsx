import type { Metadata } from "next"
import { Hanken_Grotesk } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import NavBar from "@/components/NavBar"
import { auth } from "@/auth"

const hanken = Hanken_Grotesk({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Clario",
  description: "AI-powered email assistant",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en" className={`${hanken.variable} h-full antialiased`}>
      <body className="min-h-full bg-primary-50 text-slate-900 font-sans">
        <SessionProvider session={session}>
          {session && <NavBar user={session.user} />}
          <main className={session ? "pt-16 min-h-screen" : "min-h-screen"}>
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
