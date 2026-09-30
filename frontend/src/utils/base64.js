// The backend deserializes every password / OTP field with `Base64Deserializer`,
// which expects standard (padded) Base64 of the UTF-8 bytes. Encoding happens
// here, inside the api layer, so no call site can forget it or encode twice.
export function encodeSecret(value) {
  if (value === null || value === undefined) return value
  const bytes = new TextEncoder().encode(String(value))
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}
