/**
 * Delivery channels understood by the unified OTP endpoints.
 *
 * The backend resolves the channel and reads the destination accordingly, so
 * the client only has to know which fields to collect and how to display the
 * destination back to the user.
 */
export const OTP_CHANNELS = [
  {
    id: "EMAIL",
    label: "Email",
    inputType: "email",
    inputMode: undefined,
    maxLength: undefined,
    autoComplete: "email",
    destinationLabel: "Email address",
  },
  {
    id: "MOBILE",
    label: "SMS",
    inputType: "tel",
    inputMode: "numeric",
    maxLength: 10,
    autoComplete: "tel-national",
    destinationLabel: "Mobile number",
  },
];

export const OTP_PURPOSE = {
  REGISTRATION: "REGISTRATION",
  PASSWORD_RESET: "PASSWORD_RESET",
};

export const DEFAULT_CHANNEL = "EMAIL";

export const channelById = (channelId) =>
  OTP_CHANNELS.find((channel) => channel.id === channelId) ??
  channelById(DEFAULT_CHANNEL);

export const isMobileChannel = (channelId) =>
  channelById(channelId).inputType === "tel";

export const digitsOnly = (value = "") => value.replace(/\D/g, "");

/** The last ten digits, the way the backend normalises a mobile number. */
export const nationalNumber = (value = "") => digitsOnly(value).slice(-10);

export const isValidDestination = (channelId, value = "") =>
  isMobileChannel(channelId)
    ? digitsOnly(value).length === 10
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Never echo a full mobile number back into the page. */
export const maskDestination = (channelId, value = "") =>
  isMobileChannel(channelId) ? `******${nationalNumber(value).slice(-4)}` : value;

export const describeDestination = (channelId, value = "") => {
  const channel = channelById(channelId);
  return isMobileChannel(channelId)
    ? `your mobile ending ${nationalNumber(value).slice(-4) || "····"}`
    : `your ${channel.destinationLabel.toLowerCase()} ${value}`;
};
