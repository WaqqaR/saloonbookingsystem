import { createBookingManageToken } from "./booking-tokens";
import { tenantUrl } from "./tenant";
import { formatInTenantTz } from "./datetime";
import { getServerTranslator } from "./i18n";

let _client: any | null | undefined;

async function getClient() {
  if (_client !== undefined) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) { _client = null; return null; }
  const twilio = (await import("twilio")).default;
  _client = twilio(sid, token);
  return _client;
}

export function smsEnabled() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID) &&
         Boolean(process.env.TWILIO_AUTH_TOKEN) &&
         Boolean(process.env.TWILIO_FROM_NUMBER);
}

type BookingForSms = {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: Date;
  service: { name: string };
  staff: { name: string } | null;
  tenant: { name: string; slug: string; timezone: string; defaultLocale: string };
};

async function manageLink(b: BookingForSms): Promise<string> {
  const token = await createBookingManageToken(b.id);
  return tenantUrl(b.tenant.slug, `/manage?t=${encodeURIComponent(token)}`);
}

export async function sendBookingReminderSms(b: BookingForSms) {
  const ts = await getServerTranslator(b.tenant.defaultLocale, "sms");
  const when = formatInTenantTz(b.startTime, b.tenant, "short");
  const link = await manageLink(b);
  const body = ts("reminder", {
    firstName: b.customerName.split(" ")[0],
    service: b.service.name,
    tenant: b.tenant.name,
    withStaff: b.staff ? ts("withStaff", { name: b.staff.name }) : "",
    when,
    link,
  });
  return await send(b.customerPhone, body);
}

export async function sendBookingConfirmationSms(b: BookingForSms) {
  const ts = await getServerTranslator(b.tenant.defaultLocale, "sms");
  const when = formatInTenantTz(b.startTime, b.tenant, "short");
  const link = await manageLink(b);
  const body = ts("confirmation", {
    service: b.service.name,
    tenant: b.tenant.name,
    when,
    link,
  });
  return await send(b.customerPhone, body);
}

async function send(to: string, body: string) {
  const client = await getClient();
  if (!client) {
    console.log(`[sms-stub] Would send -> ${to}: ${body}`);
    return { sent: false, stubbed: true };
  }
  const from = process.env.TWILIO_FROM_NUMBER;
  try {
    await client.messages.create({ to, from, body });
    return { sent: true };
  } catch (e: any) {
    console.error("SMS failed:", e.message);
    return { sent: false, error: e.message };
  }
}
