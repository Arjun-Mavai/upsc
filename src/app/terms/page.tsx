import type { Metadata } from 'next';
import Link from 'next/link';
import { contactEmail } from '../contact/page';

export const metadata: Metadata = {
  title: 'Terms of Service | UPSC Zen',
  description:
    'Terms of Service for UPSC Zen — the rules and guidelines for using our UPSC exam preparation platform.',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

        <div className="mt-10 space-y-10 leading-relaxed text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing UPSC Zen (&ldquo;the Platform&rdquo;), you acknowledge that you have
              read, understood, and agree to be bound by these Terms of Service. These terms
              constitute a legally binding agreement between you and UPSC Zen. We reserve the
              right to amend these terms at our discretion; continued usage after such amendments
              constitutes formal acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Account Responsibility</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Users must provide authentic and verifiable information during registration.</li>
              <li>
                You are solely responsible for maintaining the confidentiality of your account and
                password.
              </li>
              <li>
                Account sharing is strictly prohibited. Each subscription is for a single user only.
              </li>
              <li>
                We reserve the unilateral right to terminate accounts that engage in fraudulent
                activity or violate these terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Intellectual Property Rights
            </h2>
            <p className="mt-3">
              All content hosted on the Platform—including but not limited to study materials, PYQ analysis,
              explanations, and software—is the exclusive intellectual property of UPSC Zen.
              Unauthorized reproduction, distribution, or commercial exploitation of any
              material is strictly prohibited and may result in legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Payments &amp; No-Refund Policy
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Immediate Digital Access:</strong> Since our services involve immediate
                access to digital content (PYQ papers, analysis, explanations), all purchases are final.
              </li>
              <li>
                <strong>No Refunds:</strong> Under no circumstances shall UPSC Zen be liable to
                provide a refund once a subscription has been activated or digital content has been
                accessed.
              </li>
              <li>
                Pricing and plan features are subject to change with reasonable notice provided on
                the Platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Limitation of Liability</h2>
            <p className="mt-3">
              UPSC Zen provides educational tools on an &ldquo;as-is&rdquo; and
              &ldquo;as-available&rdquo; basis. While we strive for the highest degree of accuracy,
              we do not guarantee specific exam results or absolute factual error-freedom. To the
              maximum extent permitted by law, our liability is limited to the subscription fee paid
              by the user in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Governing Law &amp; Jurisdiction
            </h2>
            <p className="mt-3">
              These Terms shall be governed by and construed in accordance with the laws of India.
              Any legal action or proceeding arising under these Terms shall be brought exclusively
              in the courts of New Delhi, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Contact Us</h2>
            <p className="mt-3">
              Questions about these terms? Visit our{' '}
              <Link href="/contact" className="text-slate-900 underline hover:text-slate-600">
                Contact Page
              </Link>{' '}
              or email{' '}
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
