"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { User } from "next-auth"

function getInitials(name: string | null | undefined) {
  if (!name) return "?"
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export default function NavBar({ user }: { user: User | undefined }) {
  const pathname = usePathname()

  const tabs = [
    { label: "Inbox", href: "/dashboard" },
    { label: "Search", href: "/search" },
    { label: "Settings", href: "/settings" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center px-5 gap-5">
      <span className="flex items-center gap-2 font-semibold text-slate-900 text-base shrink-0">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white text-sm shrink-0 font-bold">+</span>
        Clario
      </span>

      <nav className="flex items-center gap-1">
        {tabs.map(({ label, href }) => {
          const active = pathname === href || (href === "/dashboard" && pathname === "/")
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-600 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        <Link href="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
            {getInitials(user?.name)}
          </span>
          <span className="text-sm text-slate-700 hidden sm:block">{user?.name}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
