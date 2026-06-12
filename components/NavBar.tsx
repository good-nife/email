"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { User } from "next-auth"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inbox" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
]

export default function NavBar({ user }: { user: User | undefined }) {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center px-6 gap-6">
      <span className="font-semibold text-slate-800 text-lg mr-4">✉ Mail Assistant</span>

      <nav className="flex gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">
        {user?.image && (
          <img src={user.image} alt={user.name ?? ""} className="w-8 h-8 rounded-full" />
        )}
        <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
