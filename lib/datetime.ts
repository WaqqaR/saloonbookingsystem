type LocaleSource = {
  defaultLocale?: string | null;
  timezone?: string | null;
};

const DEFAULT_LOCALE = "en-GB";
const DEFAULT_TIMEZONE = "Europe/London";

type Style =
  | "full"          // Monday, 18 May 2026 at 14:30
  | "long"          // 18 May 2026 at 14:30
  | "short"         // Mon, 18 May, 14:30
  | "dateLong"      // Monday, 18 May 2026
  | "dateMedium"    // 18 May 2026
  | "time"          // 14:30
  | "weekdayShort"  // Mon
  | "dayNum"        // 18
  | "monthShort";   // May

const STYLE_OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  full:         { weekday: "long",  day: "numeric", month: "long",  year: "numeric", hour: "numeric", minute: "2-digit" },
  long:         { day: "numeric",   month: "long",  year: "numeric", hour: "numeric", minute: "2-digit" },
  short:        { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  dateLong:     { weekday: "long",  day: "numeric", month: "long",  year: "numeric" },
  dateMedium:   { day: "numeric",   month: "short", year: "numeric" },
  time:         { hour: "numeric",  minute: "2-digit" },
  weekdayShort: { weekday: "short" },
  dayNum:       { day: "numeric" },
  monthShort:   { month: "short" },
};

export function formatInTenantTz(
  date: Date | string,
  source: LocaleSource | null | undefined,
  style: Style = "full",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = source?.defaultLocale || DEFAULT_LOCALE;
  const timeZone = source?.timezone || DEFAULT_TIMEZONE;
  return new Intl.DateTimeFormat(locale, { ...STYLE_OPTIONS[style], timeZone }).format(d);
}
