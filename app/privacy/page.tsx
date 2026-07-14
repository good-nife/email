import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Clario",
  description: "Privacy Policy for Clario, the AI-powered email assistant.",
}

const LAST_UPDATED = "July 13, 2026"

function ClarioMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.5 1.6c.7 5.7 1.9 6.9 7.6 7.6-5.7.7-6.9 1.9-7.6 7.6-.7-5.7-1.9-6.9-7.6-7.6 5.7-.7 6.9-1.9 7.6-7.6Z" />
      <path d="M18.4 14.2c.35 2.6.95 3.2 3.55 3.55-2.6.35-3.2.95-3.55 3.55-.35-2.6-.95-3.2-3.55-3.55 2.6-.35 3.2-.95 3.55-3.55Z" opacity="0.9" />
    </svg>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-[#1B2735] mb-3">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-primary-50 text-slate-900">
      <header className="border-b border-primary-100 bg-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-[#1B2735] text-lg">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600 text-white shrink-0">
              <ClarioMark size={15} />
            </span>
            Clario
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-primary-700 transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-bold text-[#1B2735] mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <p className="text-slate-600 leading-relaxed mb-10">
          This Privacy Policy explains how Clario LLC, a Wyoming limited liability company
          (&ldquo;Clario,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
          collects, uses, and shares information when you use our website, applications, and
          related services (collectively, the &ldquo;Service&rdquo;). By using the Service, you
          agree to the collection and use of information as described here. This Policy should be
          read together with our{" "}
          <Link href="/terms" className="text-primary-700 hover:underline">
            Terms of Use
          </Link>
          .
        </p>

        <Section title="1. Information We Collect">
          <p><strong>Account information.</strong> When you sign in with Google, we receive your name, email address, and profile information from Google.</p>
          <p><strong>Email data.</strong> When you connect an email account, you grant the Service read-only access to your inbox, plus permission to send and organize mail on your behalf. We access your email content and metadata (senders, recipients, subjects, timestamps, message bodies) only as needed to provide the features you use, such as categorization, summarization, search, and drafting.</p>
          <p><strong>Usage data.</strong> We record which features you use and metadata about each AI request (such as the model used and token counts) to operate, monitor cost, and improve the Service. This usage data does not include the content of your emails.</p>
          <p><strong>Local device storage.</strong> Drafts, summaries, and search results are cached in your browser&rsquo;s local storage on your device so the Service feels fast. This cached content is not something we control once it is on your device, and clearing your browser data will remove it.</p>
        </Section>

        <Section title="2. How We Use Information">
          <p>We use the information described above to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Provide the Service, including AI-generated categorization, summaries, search answers, and draft replies;</li>
            <li>Authenticate you and maintain your session;</li>
            <li>Monitor, maintain, and improve the reliability and performance of the Service;</li>
            <li>Detect, prevent, and address fraud, abuse, or security issues;</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            We do not sell your data, and we do not use your email content to train AI models,
            ours or anyone else&rsquo;s.
          </p>
        </Section>

        <Section title="3. How Information Is Shared">
          <p>
            We share information only with the following categories of service providers, solely
            to operate the Service, and under obligations that restrict them from using your
            information for any other purpose:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Google</strong> — to authenticate you and to read and send email on your behalf via the Gmail API;</li>
            <li><strong>Anthropic</strong> — to process email content and generate AI summaries, search answers, and drafts;</li>
            <li><strong>Voyage AI</strong> — optionally, to generate embeddings that rank relevant email threads before they are sent to Anthropic;</li>
            <li><strong>Our database and infrastructure providers</strong> — to host account records and usage data described in Section 1.</li>
          </ul>
          <p>
            We may also disclose information if required by law, or to protect the rights,
            property, or safety of Clario, our users, or others.
          </p>
        </Section>

        <Section title="4. Data Storage and Retention">
          <p>
            Account records, such as your email address and usage metadata, are retained for as
            long as your account is active. Email content is processed to generate a response and
            is not permanently stored on our servers; where email content is cached to speed up
            repeated requests, it is stored locally in your browser rather than on our servers. We
            retain vector representations of your email threads (not the underlying text) to power
            search ranking; these are deleted when you disconnect your account or request deletion.
          </p>
          <p>
            You may disconnect your email account and delete your account data at any time by
            revoking access from your{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
              Google Account permissions
            </a>{" "}
            page and contacting us to request deletion of remaining records.
          </p>
        </Section>

        <Section title="5. Google User Data">
          <p>
            Clario&rsquo;s use and transfer of information received from Google APIs adheres to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We access Gmail data only to provide
            user-facing features within the Service, and we do not use Gmail data for advertising,
            and we do not allow humans to read it except as necessary for security, legal
            compliance, or with your consent.
          </p>
        </Section>

        <Section title="6. Your Rights and Choices">
          <p>
            Depending on where you live, you may have rights to access, correct, export, or delete
            your personal information, or to object to or restrict certain processing. You can
            exercise most of these rights directly: revoke Gmail access at any time from your
            Google Account, or contact us using the details below to request access to or deletion
            of your data.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            The Service is not directed to children under 16, and we do not knowingly collect
            information from them. If you believe a child has provided us with personal
            information, please contact us and we will delete it.
          </p>
        </Section>

        <Section title="8. International Data Transfers">
          <p>
            We and our service providers may process information in countries other than your own.
            Where required, we rely on appropriate safeguards, such as standard contractual
            clauses, to protect information transferred internationally.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We use reasonable technical and organizational measures designed to protect your
            information. No method of transmission or storage is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we
            will provide reasonable notice, such as by updating the &ldquo;Last updated&rdquo; date
            above or notifying you directly. Continued use of the Service after changes take
            effect constitutes acceptance of the revised Policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about this Privacy Policy or your information can be sent to{" "}
            <a href="mailto:privacy@clario.app" className="text-primary-700 hover:underline">
              privacy@clario.app
            </a>
            .
          </p>
        </Section>
      </main>
    </div>
  )
}
