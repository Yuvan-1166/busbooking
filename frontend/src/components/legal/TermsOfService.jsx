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

export default function TermsOfService() {
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
            Terms of Service.
          </h1>
          <p className="text-[12px] text-muted">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <p className="mb-8 text-[13px] leading-[1.75] text-muted">
          Please read these Terms of Service ("Terms") carefully before using
          Bus Booking. By creating an account or using the platform, you agree
          to be bound by these Terms.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Bus Booking, you confirm that you are at
            least 13 years old and have the legal capacity to enter into this
            agreement. If you are using the platform on behalf of a business,
            you represent that you have authority to bind that business to
            these Terms.
          </p>
        </Section>

        <Section title="2. Account Registration">
          <p>
            You may register using an email address and password, or via a
            supported OAuth provider (Google, Twitter/X). You are responsible
            for maintaining the confidentiality of your credentials and for all
            activity that occurs under your account.
          </p>
          <p>
            You must provide accurate and complete information when registering.
            Accounts found to contain false information may be suspended or
            terminated.
          </p>
        </Section>

        <Section title="3. Use of the Platform">
          <p>You agree not to:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              Use the platform for any unlawful purpose or in violation of any
              applicable regulations.
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the system,
              other user accounts, or backend infrastructure.
            </li>
            <li>
              Abuse, disrupt, or overload the service with automated requests.
            </li>
            <li>
              Provide false passenger information in bookings, including
              misrepresentation of age or identity.
            </li>
          </ul>
        </Section>

        <Section title="4. Bookings and Payments">
          <p>
            <strong className="text-ink">Booking confirmation</strong> — A
            booking is confirmed when payment has been successfully processed
            and a ticket has been issued.
          </p>
          <p>
            <strong className="text-ink">Cancellations</strong> — Passengers
            may cancel bookings subject to the cancellation policy displayed at
            the time of booking. Refunds, where applicable, are credited to
            your wallet.
          </p>
          <p>
            <strong className="text-ink">Payment</strong> — Payments are
            processed through our integrated payment gateway. Bus Booking does
            not store full card details.
          </p>
          <p>
            <strong className="text-ink">Operator responsibilities</strong> —
            Operators are responsible for the accuracy of trip schedules, seat
            availability, and pricing listed on the platform.
          </p>
        </Section>

        <Section title="5. Wallet">
          <p>
            Passengers receive a platform wallet funded with an introductory
            balance. Wallet credits are non-transferable, have no cash value,
            and may only be used for bookings within Bus Booking. We reserve
            the right to modify, suspend, or terminate wallet functionality
            at any time.
          </p>
        </Section>

        <Section title="6. Two-Factor Authentication">
          <p>
            We offer optional two-factor authentication (TOTP and email OTP)
            to help protect your account. Enabling 2FA is recommended. Bus
            Booking is not liable for account compromise resulting from failure
            to enable available security features.
          </p>
        </Section>

        <Section title="7. Third-Party OAuth Providers">
          <p>
            Sign-in via Google or Twitter (X) is subject to the respective
            provider's terms and privacy policies. Bus Booking is not
            responsible for the availability, accuracy, or actions of those
            third-party services.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            All content, design, and code on this platform is owned by or
            licensed to Bus Booking. You may not copy, reproduce, or
            redistribute any part of the platform without prior written
            permission.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Bus Booking shall not be
            liable for any indirect, incidental, special, or consequential
            damages arising out of your use of the platform, including but not
            limited to missed journeys, data loss, or service interruption.
          </p>
          <p>
            Our total liability to you for any claim arising from these Terms
            shall not exceed the amount you paid for the booking giving rise to
            the claim.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            We reserve the right to suspend or terminate your account at our
            discretion if you violate these Terms or engage in conduct that is
            harmful to other users or to the platform. You may close your
            account at any time by contacting us.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may revise these Terms at any time. The "Last updated" date will
            reflect any changes. Continued use of the platform after changes
            are posted constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with
            applicable law. Any disputes arising out of or in connection with
            these Terms shall be subject to the exclusive jurisdiction of the
            competent courts in the applicable jurisdiction.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            For questions about these Terms, contact us at{" "}
            <a
              href="mailto:legal@busbooking.local"
              className="text-green underline underline-offset-2"
            >
              legal@busbooking.local
            </a>
            .
          </p>
        </Section>

        {/* Footer nav */}
        <div className="mt-10 flex gap-5 border-t border-line pt-6 text-[11px] text-muted">
          <button
            onClick={() => navigate("/privacy")}
            className="border-0 bg-transparent p-0 underline underline-offset-2"
          >
            Privacy Policy
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
