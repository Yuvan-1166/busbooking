import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { createSession, storeSession } from "../../auth/authStorage";

const STATE_KEY = "twitter_oauth_state";
const USER_TYPE_KEY = "twitter_oauth_user_type";

/**
 * TwitterCallback
 *
 * Mounted at /auth/twitter/callback. Twitter redirects here after the user
 * approves (or denies) access, appending ?code=...&state=... to the URL.
 *
 * Flow:
 *  1. Read code + state from the URL search params.
 *  2. Validate state against the value saved in sessionStorage before the
 *     redirect — prevents CSRF.
 *  3. POST code + state + userType to the backend /api/v1/auth/oauth/callback.
 *  4. On success, build a session, persist it, and navigate to /.
 *  5. On failure, show an error with a "Try again" link back to /login.
 */
export default function TwitterCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // 'loading' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  // Prevent the effect from running twice in React StrictMode
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function handleCallback() {
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const twitterError = searchParams.get("error");

      // ── User denied access ─────────────────────────────────────────────
      if (twitterError) {
        setErrorMessage(
          twitterError === "access_denied"
            ? "You cancelled the Twitter sign-in. You can try again anytime."
            : `Twitter returned an error: ${twitterError}`,
        );
        setStatus("error");
        return;
      }

      // ── Missing params ─────────────────────────────────────────────────
      if (!code || !returnedState) {
        setErrorMessage(
          "Invalid callback — missing authorization code or state. Please try again.",
        );
        setStatus("error");
        return;
      }

      // ── CSRF check ─────────────────────────────────────────────────────
      const savedState = sessionStorage.getItem(STATE_KEY);
      if (!savedState || savedState !== returnedState) {
        setErrorMessage(
          "Security check failed (state mismatch). Please start the sign-in process again.",
        );
        sessionStorage.removeItem(STATE_KEY);
        sessionStorage.removeItem(USER_TYPE_KEY);
        setStatus("error");
        return;
      }

      // ── Exchange code for JWT ──────────────────────────────────────────
      const userType = sessionStorage.getItem(USER_TYPE_KEY) || "PASSENGER";
      sessionStorage.removeItem(STATE_KEY);
      sessionStorage.removeItem(USER_TYPE_KEY);

      try {
        const loginResponse = await api.oauthCallback({
          provider: "TWITTER",
          code,
          state: returnedState,
          userType,
        });
        const session = createSession(loginResponse);
        storeSession(session);

        // Onboarding flag is set for brand-new Twitter users
        if (loginResponse.onboardingRequired) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Twitter callback error:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Twitter authentication failed. Please try again.";
        setErrorMessage(message);
        setStatus("error");
      }
    }

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#dce5d5] px-4">
        <div className="w-full max-w-[400px] bg-paper p-10 text-center shadow-[0_18px_42px_rgba(48,53,43,.12)]">
          <span className="mx-auto mb-5 grid h-[31px] w-[31px] rotate-[-8deg] place-items-center rounded-full bg-ink font-display text-base text-[#f9d66d]">
            B
          </span>
          <p className="mb-2 font-mono text-[10px] tracking-[.13em] text-green">
            BUS BOOKING
          </p>
          <h1 className="mb-3 font-display text-2xl font-semibold text-ink">
            Signing you in…
          </h1>
          <p className="text-[12px] text-muted">
            Completing your Twitter sign-in. Please wait.
          </p>
          {/* Animated dots */}
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-orange"
                style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }}
              />
            ))}
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: .25; transform: scale(.8); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      </main>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  return (
    <main className="grid min-h-screen place-items-center bg-[#dce5d5] px-4">
      <div className="w-full max-w-[400px] bg-paper p-10 shadow-[0_18px_42px_rgba(48,53,43,.12)]">
        <span className="mx-auto mb-5 grid h-[31px] w-[31px] rotate-[-8deg] place-items-center rounded-full bg-ink font-display text-base text-[#f9d66d]">
          B
        </span>
        <p className="mb-2 text-center font-mono text-[10px] tracking-[.13em] text-green">
          BUS BOOKING
        </p>
        <h1 className="mb-3 text-center font-display text-2xl font-semibold text-ink">
          Sign-in failed.
        </h1>

        <div
          className="mb-5 border border-[#d79b8b] bg-[#f7e5df] p-3 text-[12px] leading-5 text-[#8c3e2d]"
          role="alert"
        >
          {errorMessage}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full border-0 bg-orange px-4 py-3.5 text-left font-bold text-white"
        >
          Try again
          <span className="float-right text-lg">→</span>
        </button>
      </div>
    </main>
  );
}
