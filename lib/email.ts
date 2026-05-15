import { Resend } from "resend";
import { format } from "date-fns";
import { formatPrice } from "./utils";
import { buildBookingIcs } from "./calendar";
import { createBookingManageToken } from "./booking-tokens";
import { tenantUrl } from "./tenant";

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
  endTime: Date;
  customerName: string;
  customerEmail: string;
  priceCents: number;
  service: { name: string };
  staff: { name: string } | null;
  tenant: { name: string; slug: string; currency: string; email: string };
};

async function manageLink(b: BookingWithRefs): Promise<string> {
  const token = await createBookingManageToken(b.id);
  return tenantUrl(b.tenant.slug, `/manage?t=${encodeURIComponent(token)}`);
}

function icsAttachment(b: BookingWithRefs) {
  const ics = buildBookingIcs({
    uid: `${b.id}@${b.tenant.slug}`,
    summary: `${b.service.name} — ${b.tenant.name}`,
    description: `Booking at ${b.tenant.name}${b.staff ? ` with ${b.staff.name}` : ""}.`,
    startTime: b.startTime,
    endTime: b.endTime,
  });
  return {
    filename: "appointment.ics",
    content: Buffer.from(ics, "utf8").toString("base64"),
    contentType: "text/calendar; method=PUBLISH",
  };
}

export async function sendBookingConfirmation(b: BookingWithRefs) {
  const subject = `Booking confirmed — ${b.service.name} at ${b.tenant.name}`;
  const when = format(b.startTime, "EEEE, MMMM d 'at' h:mm a");
  const manageUrl = await manageLink(b);
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
    <p>The attached calendar invite will add this appointment to your phone.</p>
    <p>Need to cancel or reschedule? <a href="${manageUrl}">Manage your booking</a>.</p>
    <p style="color:#777;font-size:12px;margin-top:32px">${escape(b.tenant.name)}</p>
  `;
  const ics = icsAttachment(b);

  const resend = getResend();
  if (!resend) {
    console.log(`[email-stub] Would send confirmation -> ${b.customerEmail} (${subject}) + ${ics.filename} + ${manageUrl}`);
    console.log(`[email-stub] Would send notification -> ${b.tenant.email}`);
    return;
  }
  const from = process.env.RESEND_FROM || "bookings@example.com";
  await resend.emails.send({
    from,
    to: b.customerEmail,
    subject,
    html,
    attachments: [ics],
  });
  await resend.emails.send({
    from,
    to: b.tenant.email,
    subject: `New booking: ${b.service.name} for ${b.customerName}`,
    html: html.replace("Your booking is confirmed", "New booking received"),
  });
}

export async function sendBookingReminder(b: BookingWithRefs) {
  const when = format(b.startTime, "EEEE, MMMM d 'at' h:mm a");
  const manageUrl = await manageLink(b);
  const html = `
    <h2>Your appointment is coming up</h2>
    <p>Hi ${escape(b.customerName)},</p>
    <p>This is a friendly reminder of your appointment at <strong>${escape(b.tenant.name)}</strong>.</p>
    <ul>
      <li><strong>Service:</strong> ${escape(b.service.name)}</li>
      ${b.staff ? `<li><strong>Staff:</strong> ${escape(b.staff.name)}</li>` : ""}
      <li><strong>When:</strong> ${when}</li>
    </ul>
    <p>Need to cancel or reschedule? <a href="${manageUrl}">Manage your booking</a>.</p>
    <p>See you soon!</p>
  `;
  const resend = getResend();
  if (!resend) {
    console.log(`[email-stub] Would send reminder -> ${b.customerEmail} + ${manageUrl}`);
    return;
  }
  const from = process.env.RESEND_FROM || "bookings@example.com";
  await resend.emails.send({ from, to: b.customerEmail, subject: `Reminder: ${b.service.name} ${when}`, html });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]!));
}
