"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { User } from "next-auth"

export default function NavBar({ user }: { user: User | undefined }) {
  const pathname = usePathname()

  const tabs = [
    { label: "Inbox", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-100 border-b border-primary-200 h-16 flex items-center px-6 gap-6">
      {/* Logo */}
      <span className="flex items-center gap-2 font-semibold text-slate-800 text-lg shrink-0">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.5 1.6c.7 5.7 1.9 6.9 7.6 7.6-5.7.7-6.9 1.9-7.6 7.6-.7-5.7-1.9-6.9-7.6-7.6 5.7-.7 6.9-1.9 7.6-7.6Z" />
            <path d="M18.4 14.2c.35 2.6.95 3.2 3.55 3.55-2.6.35-3.2.95-3.55 3.55-.35-2.6-.95-3.2-3.55-3.55 2.6-.35 3.2-.95 3.55-3.55Z" opacity="0.9" />
          </svg>
        </span>
        Clario
      </span>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1">
        {tabs.map(({ label, href }) => {
          const active = pathname === href || (href === "/dashboard" && pathname === "/")
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right: user + sign out */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-3">
          {user?.image && (
            <img src={user.image} alt={user.name ?? ""} className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
        </div>
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
