import { useNavigate } from "react-router-dom";

const LAST_UPDATED = "September 18, 2026";

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="mb-3 font-display text-[22px] font-semibold leading-snug text-ink">
      {title}
    </h2>
    <div className="space-y-3 text-[13px] leading-[1.75] text-muted">
      {children}
    </div>
  </section>
);

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#dce5d5] px-4 py-12">
      <article className="mx-auto w-full max-w-[720px] bg-paper p-[46px] shadow-[0_18px_42px_rgba(48,53,43,.12)] max-[640px]:p-7">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-1.5 border-0 bg-transparent p-0 text-[11px] font-mono text-muted underline underline-offset-2"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-10 border-b border-line pb-8">
          <p className="mb-2 font-mono text-[10px] tracking-[.13em] text-green">
            BUS BOOKING
          </p>
          <h1 className="mb-3 font-display text-[42px] font-semibold leading-[.96] text-ink max-[640px]:text-3xl">
            Privacy Policy.
          </h1>
          <p className="text-[12px] text-muted">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <p className="mb-8 text-[13px] leading-[1.75] text-muted">
          Bus Booking ("we", "us", or "our") operates this platform to help
          passengers find and book bus trips and to help operators manage
          their fleets. This Privacy Policy explains what personal data we
          collect, how we use it, and your rights over it.
        </p>

        <Section title="1. Information We Collect">
          <p>
            <strong className="text-ink">Account data</strong> — When you
            register you provide your name, email address, and optionally a
            phone number. Operator accounts also provide a business name and
            registration number.
          </p>
          <p>
            <strong className="text-ink">OAuth sign-in data</strong> — If you
            sign in with Google or Twitter (X), we receive a stable
            identifier, your display name, and (where available) your email
            address from those providers. We do not receive or store your
            social-media password.
          </p>
          <p>
            <strong className="text-ink">Booking &amp; payment data</strong> —
            Passenger names, ages, and genders entered during booking; payment
            method selection; and transaction identifiers from our mock payment
            gateway.
          </p>
          <p>
            <strong className="text-ink">Usage data</strong> — Standard server
            logs including IP address, browser type, pages accessed, and
            timestamps.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your data to:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>Create and manage your account.</li>
            <li>Process bookings, issue tickets, and handle cancellations.</li>
            <li>
              Send transactional emails (booking confirmation, OTP codes,
              password resets).
            </li>
            <li>
              Authenticate your identity and protect against fraud using
              one-time passwords and optional two-factor authentication.
            </li>
            <li>Improve platform reliability and performance.</li>
          </ul>
          <p>
            We do not sell or rent your personal data to third parties, and we
            do not use it for advertising purposes.
          </p>
        </Section>

        <Section title="3. Third-Party Services">
          <p>We integrate with the following third-party services:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              <strong className="text-ink">Google OAuth</strong> — identity
              verification. Subject to the{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green underline underline-offset-2"
              >
                Google Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-ink">Twitter (X) OAuth</strong> — identity
              verification. Subject to the{" "}
              <a
                href="https://twitter.com/en/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green underline underline-offset-2"
              >
                X Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-ink">MessageCentral</strong> — SMS OTP
              delivery for mobile verification. Your phone number is shared
              only for the purpose of delivering a one-time code.
            </li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>
            Account data is retained for as long as your account is active. If
            you request deletion, we will remove your personal data within 30
            days, except where retention is required by law or for resolving
            disputes.
          </p>
        </Section>

        <Section title="5. Cookies and Storage">
          <p>
            We use browser <code className="text-[12px] text-orange">localStorage</code> to
            persist your authenticated session. No cross-site tracking cookies
            are set. Session tokens expire after one hour and are cleared on
            sign-out.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            Passwords are hashed with BCrypt before storage — we never store
            plaintext passwords. All API communication is intended to be served
            over HTTPS in production. OAuth tokens are validated server-side
            and never exposed to other users.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data via your profile settings.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>
              Withdraw consent for optional features (e.g. two-factor
              authentication) at any time.
            </li>
          </ul>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            This platform is not directed at children under the age of 13. We
            do not knowingly collect personal data from children. If you believe
            a child has provided us with personal information, please contact us
            so we can delete it.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. The "Last
            updated" date at the top of this page will reflect any changes. We
            encourage you to review this page periodically.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            If you have any questions about this Privacy Policy or wish to
            exercise your data rights, please contact us at{" "}
            <a
              href="mailto:privacy@busbooking.local"
              className="text-green underline underline-offset-2"
            >
              privacy@busbooking.local
            </a>
            .
          </p>
        </Section>

        {/* Footer nav */}
        <div className="mt-10 flex gap-5 border-t border-line pt-6 text-[11px] text-muted">
          <button
            onClick={() => navigate("/terms")}
            className="border-0 bg-transparent p-0 underline underline-offset-2"
          >
            Terms of Service
          </button>
          <button
            onClick={() => navigate("/login")}
            className="border-0 bg-transparent p-0 underline underline-offset-2"
          >
            Sign in
          </button>
        </div>
      </article>
    </main>
  );
}
