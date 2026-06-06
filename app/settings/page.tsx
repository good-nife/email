"use client"

import { useSession } from "next-auth/react"

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Account</h2>
        <div className="flex items-center gap-3">
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <div className="font-medium text-slate-900 text-sm">{session?.user?.name}</div>
            <div className="text-xs text-slate-500">{session?.user?.email}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
