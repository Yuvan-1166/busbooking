import { OTP_CHANNELS } from "../../utils/otpChannel";

/**
 * Lets the user pick which channel a one-time password is delivered on.
 *
 * Every screen shows the same choice — the code itself travels through the
 * same endpoint either way — so the wording and the styling live here instead
 * of being repeated per screen. Callers pass their own `channels` when they
 * need per-channel hints, such as which channel already has a live code.
 */
const VARIANTS = {
  app: {
    wrapper: "flex gap-2",
    button: (active) => `btn flex-1 ${active ? "btn-primary" : "btn-ghost"}`,
  },
  plain: {
    wrapper: "flex gap-2",
    button: (active) =>
      `flex-1 border px-3 py-2 text-xs font-bold uppercase ${
        active
          ? "border-orange bg-orange text-white"
          : "border-line bg-transparent text-muted"
      }`,
  },
};

export default function OtpChannelPicker({
  value,
  onChange,
  channels = OTP_CHANNELS,
  variant = "plain",
  disabled = false,
}) {
  const styles = VARIANTS[variant] ?? VARIANTS.plain;

  return (
    <div
      className={styles.wrapper}
      role="group"
      aria-label="Verification code delivery method"
    >
      {channels.map((channel) => {
        const active = channel.id === value;
        return (
          <button
            key={channel.id}
            type="button"
            className={styles.button(active)}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(channel.id)}
          >
            {channel.label}
          </button>
        );
      })}
    </div>
  );
}
