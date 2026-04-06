import type { Metadata } from 'next';
import Link from 'next/link';
import { contactEmail } from '../contact/page';

export const metadata: Metadata = {
  title: 'Privacy Policy | UPSC Intelligence',
  description:
    'Privacy Policy for UPSC Intelligence — learn how we collect, use, and protect your data on our UPSC exam preparation platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

        <div className="mt-10 space-y-10 leading-relaxed text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Data Collection Scope</h2>
            <p className="mt-3">
              To provide a bespoke educational experience, UPSC Intelligence collects essential
              information including registration details (name, email), academic progress data (quiz
              scores, study time), and technical metadata to ensure platform stability and
              performance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Purpose of Processing</h2>
            <p className="mt-3">
              Your data is utilized exclusively to enhance your learning journey. This includes
              generating personalized performance analytics, providing smart study recommendations,
              and facilitating secure account management. We also use aggregated, anonymized data to
              improve our pedagogical tools and content accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. Information Security</h2>
            <p className="mt-3">
              We employ industry-standard encryption protocols (SSL/TLS) and secure server
              architectures to safeguard your personal information. While no digital system is
              impenetrable, we maintain rigorous internal controls to prevent unauthorized access,
              disclosure, or alteration of your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Third-Party Disclosures</h2>
            <p className="mt-3">
              UPSC Intelligence does not sell or trade your personal information. Data sharing is
              strictly limited to essential service providers (e.g., payment processors, hosting
              partners) who are contractually bound to maintain your privacy. Legal disclosures are
              made only when mandated by valid judicial or governmental orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. User Rights &amp; Governance
            </h2>
            <p className="mt-3">
              You retain the right to access, rectify, or request the deletion of your personal
              data. These terms and our privacy practices are governed by the Information Technology
              Act, 2000, and other applicable laws of India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Contact Us</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy, reach out via our{' '}
              <Link href="/contact" className="text-slate-900 underline hover:text-slate-600">
                Contact Page
              </Link>{' '}
              or email us at{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="text-slate-900 underline hover:text-slate-600"
              >
                {contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
