import { createTranslator } from "next-intl";

const DEFAULT_LOCALE = "en-GB";
const cache: Record<string, Promise<Record<string, unknown>>> = {};

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  if (!cache[locale]) {
    cache[locale] = import(`../messages/${locale}.json`)
      .then((m) => m.default as Record<string, unknown>)
      .catch(() => import("../messages/en-GB.json").then((m) => m.default as Record<string, unknown>));
  }
  return cache[locale];
}

export type ServerTranslator = (key: string, values?: Record<string, string | number>) => string;

// For server contexts outside the request lifecycle — email + SMS templates,
// background jobs, cron — where the React-bound `getTranslations` isn't usable.
// Returns a loosely-typed translator; the strong type-checking next-intl offers
// for React-side translations doesn't survive dynamic-locale message loading.
export async function getServerTranslator(
  locale: string | null | undefined,
  namespace?: string,
): Promise<ServerTranslator> {
  const effective = locale || DEFAULT_LOCALE;
  const messages = await loadMessages(effective);
  return createTranslator({
    locale: effective,
    messages: messages as Parameters<typeof createTranslator>[0]["messages"],
    namespace: namespace as never,
  }) as unknown as ServerTranslator;
}
