// Indian vehicle registration number helpers (Indian RTO standards).

// Compact (separators stripped, uppercased) forms used for strict matching.
const COMPACT_STATE_PATTERN = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
const COMPACT_BH_PATTERN = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

export const INDIAN_PLATE_ERROR =
  "Registration number must follow the Indian RTO format (e.g., KA 01 AB 1234).";

// Matches Indian plates written with optional space/hyphen separators:
//   Standard:  AA 00 BB 0000  (2-letter state, 1-2 digit RTO, 1-3 letter series, 4 digits)
//   Bharat:    00 BH 0000 AA  (Bharat series)
const SEPARATOR = "[\\s-]?";
export const INDIAN_PLATE_PATTERN = new RegExp(
  `^(?:[A-Za-z]{2}${SEPARATOR}[0-9]{1,2}${SEPARATOR}[A-Za-z]{1,3}${SEPARATOR}[0-9]{4}|[0-9]{2}${SEPARATOR}BH${SEPARATOR}[0-9]{4}${SEPARATOR}[A-Za-z]{1,2})$`,
);

export function isValidIndianPlate(value) {
  const compact = compactPlate(value);
  return (
    COMPACT_STATE_PATTERN.test(compact) || COMPACT_BH_PATTERN.test(compact)
  );
}

// Canonicalizes a valid plate to a consistent "AA 00 BB 0000" (or "00 BH 0000 AA")
// representation with single spaces. Invalid values are returned uppercased/trimmed.
export function normalizeIndianPlate(value) {
  const compact = compactPlate(value);

  if (COMPACT_STATE_PATTERN.test(compact)) {
    const state = compact.slice(0, 2);
    const rest = compact.slice(2);
    const match = rest.match(/^([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/);
    if (match) return `${state} ${match[1]} ${match[2]} ${match[3]}`;
  }

  if (COMPACT_BH_PATTERN.test(compact)) {
    return `${compact.slice(0, 2)} BH ${compact.slice(4, 8)} ${compact.slice(8)}`;
  }

  return String(value || "").toUpperCase().trim();
}

function compactPlate(value) {
  return String(value || "").toUpperCase().replace(/[\s-]+/g, "");
}