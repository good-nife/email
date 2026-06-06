import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SignInButton from "@/components/SignInButton"

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">✉</div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Mail Assistant</h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          Categorize your inbox, draft emails in your voice, and summarize your
          conversations — all powered by AI.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-4">
          <SignInButton />
          <p className="text-xs text-slate-400">
            Connects to Gmail. You control your data.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-left">
          {[
            { icon: "📬", title: "Smart Inbox", desc: "Emails sorted into categories automatically" },
            { icon: "✍️", title: "Your Voice", desc: "AI drafts that sound like you" },
            { icon: "🔍", title: "Find Anyone", desc: "Summarize your full history with a person" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-medium text-slate-800 text-sm">{title}</div>
              <div className="text-xs text-slate-500 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
