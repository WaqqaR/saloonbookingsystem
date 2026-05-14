import { format } from "date-fns";

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
  customerName: string;
  customerPhone: string;
  startTime: Date;
  service: { name: string };
  staff: { name: string } | null;
  tenant: { name: string };
};

export async function sendBookingReminderSms(b: BookingForSms) {
  const when = format(b.startTime, "EEE MMM d 'at' h:mm a");
  const body = `Hi ${b.customerName.split(" ")[0]}, reminder of your ${b.service.name} appointment at ${b.tenant.name}${b.staff ? ` with ${b.staff.name}` : ""} on ${when}. See you soon!`;

  const client = await getClient();
  if (!client) {
    console.log(`[sms-stub] Would send -> ${b.customerPhone}: ${body}`);
    return { sent: false, stubbed: true };
  }
  const from = process.env.TWILIO_FROM_NUMBER;
  try {
    await client.messages.create({ to: b.customerPhone, from, body });
    return { sent: true };
  } catch (e: any) {
    console.error("SMS failed:", e.message);
    return { sent: false, error: e.message };
  }
}

export async function sendBookingConfirmationSms(b: BookingForSms) {
  const when = format(b.startTime, "EEE MMM d 'at' h:mm a");
  const body = `Booking confirmed: ${b.service.name} at ${b.tenant.name} on ${when}.`;
  const client = await getClient();
  if (!client) {
    console.log(`[sms-stub] Would send -> ${b.customerPhone}: ${body}`);
    return { sent: false, stubbed: true };
  }
  const from = process.env.TWILIO_FROM_NUMBER;
  try {
    await client.messages.create({ to: b.customerPhone, from, body });
    return { sent: true };
  } catch (e: any) {
    console.error("SMS failed:", e.message);
    return { sent: false, error: e.message };
  }
}
