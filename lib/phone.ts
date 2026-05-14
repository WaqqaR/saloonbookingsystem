// Normalises a user-entered phone number to E.164 (e.g. "+447700900123").
// Assumes UK as the default region when the input has no country code, matching
// the platform's default tenant locale (Europe/London, GBP). Inputs that already
// start with "+" or "00" are treated as international and used as-is.
// Returns null if the result is not a plausible E.164 number.
export function normalizePhoneE164(
  input: string,
  defaultCountryDialCode = "44",
): string | null {
  if (!input) return null;
  const cleaned = input.replace(/[\s\-().]/g, "");

  let candidate: string;
  if (cleaned.startsWith("+")) {
    candidate = "+" + cleaned.slice(1).replace(/\D/g, "");
  } else if (cleaned.startsWith("00")) {
    candidate = "+" + cleaned.slice(2).replace(/\D/g, "");
  } else {
    const digits = cleaned.replace(/\D/g, "");
    const local = digits.startsWith("0") ? digits.slice(1) : digits;
    candidate = "+" + defaultCountryDialCode + local;
  }

  return /^\+\d{8,15}$/.test(candidate) ? candidate : null;
}
