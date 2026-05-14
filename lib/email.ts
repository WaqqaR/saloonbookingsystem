import { Resend } from "resend";
import { format } from "date-fns";
import { formatPrice } from "./utils";

let _resend: Resend | null | undefined;

function getResend(): Resend | null {
  if (_resend !== undefined) return _resend;
  const key = process.env.RESEND_API_KEY;
  _resend = key ? new Resend(key) : null;
  return _resend;
}

type BookingWithRefs = {
  id: string;
  startTime: Date;
  customerName: string;
  customerEmail: string;
  priceCents: number;
  service: { name: string };
  staff: { name: string } | null;
  tenant: { name: string; currency: string; email: string };
};

export async function sendBookingConfirmation(b: BookingWithRefs) {
  const subject = `Booking confirmed — ${b.service.name} at ${b.tenant.name}`;
  const when = format(b.startTime, "EEEE, MMMM d 'at' h:mm a");
  const html = `
    <h2>Your booking is confirmed</h2>
    <p>Hi ${escape(b.customerName)},</p>
    <p>We&rsquo;ve reserved your appointment at <strong>${escape(b.tenant.name)}</strong>.</p>
    <ul>
      <li><strong>Service:</strong> ${escape(b.service.name)}</li>
      ${b.staff ? `<li><strong>Staff:</strong> ${escape(b.staff.name)}</li>` : ""}
      <li><strong>When:</strong> ${when}</li>
      <li><strong>Total:</strong> ${formatPrice(b.priceCents, b.tenant.currency)}</li>
      <li><strong>Confirmation #:</strong> ${b.id.slice(-8).toUpperCase()}</li>
    </ul>
    <p>See you soon!</p>
    <p style="color:#777;font-size:12px">${escape(b.tenant.name)}</p>
  `;

  const resend = getResend();
  if (!resend) {
    console.log(`[email-stub] Would send confirmation -> ${b.customerEmail} (${subject})`);
    console.log(`[email-stub] Would send notification -> ${b.tenant.email}`);
    return;
  }
  const from = process.env.RESEND_FROM || "bookings@example.com";
  await resend.emails.send({ from, to: b.customerEmail, subject, html });
  await resend.emails.send({
    from,
    to: b.tenant.email,
    subject: `New booking: ${b.service.name} for ${b.customerName}`,
    html: html.replace("Your booking is confirmed", "New booking received"),
  });
}

export async function sendBookingReminder(b: BookingWithRefs) {
  const when = format(b.startTime, "EEEE, MMMM d 'at' h:mm a");
  const html = `
    <h2>Your appointment is tomorrow</h2>
    <p>Hi ${escape(b.customerName)},</p>
    <p>This is a friendly reminder of your appointment at <strong>${escape(b.tenant.name)}</strong>.</p>
    <ul>
      <li><strong>Service:</strong> ${escape(b.service.name)}</li>
      ${b.staff ? `<li><strong>Staff:</strong> ${escape(b.staff.name)}</li>` : ""}
      <li><strong>When:</strong> ${when}</li>
    </ul>
    <p>See you soon!</p>
  `;
  const resend = getResend();
  if (!resend) {
    console.log(`[email-stub] Would send reminder -> ${b.customerEmail}`);
    return;
  }
  const from = process.env.RESEND_FROM || "bookings@example.com";
  await resend.emails.send({ from, to: b.customerEmail, subject: `Reminder: ${b.service.name} tomorrow`, html });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]!));
}
