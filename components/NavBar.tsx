"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import type { User } from "next-auth"

export default function NavBar({ user }: { user: User | undefined }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-100 border-b border-primary-200 h-16 flex items-center px-6 gap-6">
      <span className="flex items-center gap-2 font-semibold text-slate-800 text-lg">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white text-sm shrink-0">✉</span>
        Clario
      </span>

      <div className="flex items-center gap-3 ml-auto">
        <Link href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {user?.image && (
            <img src={user.image} alt={user.name ?? ""} className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
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
