import { Resend } from "resend";
import { formatPrice } from "./utils";
import { buildBookingIcs } from "./calendar";
import { createBookingManageToken } from "./booking-tokens";
import { tenantUrl } from "./tenant";
import { formatInTenantTz } from "./datetime";
import { getServerTranslator, type ServerTranslator } from "./i18n";

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
  tenant: { name: string; slug: string; currency: string; email: string; timezone: string; defaultLocale: string };
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
  const locale = b.tenant.defaultLocale;
  const te = await getServerTranslator(locale, "email");
  const tc = await getServerTranslator(locale, "email.confirmation");
  const tn = await getServerTranslator(locale, "email.notification");

  const subject = te("subjectConfirmation", { service: b.service.name, tenant: b.tenant.name });
  const when = formatInTenantTz(b.startTime, b.tenant, "full");
  const manageUrl = await manageLink(b);
  const html = renderConfirmationHtml(b, when, manageUrl, tc, tc("heading"));
  const ownerHtml = renderConfirmationHtml(b, when, manageUrl, tc, tn("heading"));
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
    subject: te("subjectNotification", { service: b.service.name, customer: b.customerName }),
    html: ownerHtml,
  });
}

function renderConfirmationHtml(
  b: BookingWithRefs,
  when: string,
  manageUrl: string,
  tc: ServerTranslator,
  heading: string,
) {
  return `
    <h2>${heading}</h2>
    <p>${tc("greeting", { name: escape(b.customerName) })}</p>
    <p>${tc("intro", { tenant: `<strong>${escape(b.tenant.name)}</strong>` })}</p>
    <ul>
      <li><strong>${tc("lineService")}:</strong> ${escape(b.service.name)}</li>
      ${b.staff ? `<li><strong>${tc("lineStaff")}:</strong> ${escape(b.staff.name)}</li>` : ""}
      <li><strong>${tc("lineWhen")}:</strong> ${when}</li>
      <li><strong>${tc("lineTotal")}:</strong> ${formatPrice(b.priceCents, b.tenant.currency)}</li>
      <li><strong>${tc("lineConfirmation")}:</strong> ${b.id.slice(-8).toUpperCase()}</li>
    </ul>
    <p>${tc("icsNote")}</p>
    <p>${tc("manageCta", { url: manageUrl })}</p>
    <p style="color:#777;font-size:12px;margin-top:32px">${escape(b.tenant.name)}</p>
  `;
}

export async function sendBookingReminder(b: BookingWithRefs) {
  const locale = b.tenant.defaultLocale;
  const te = await getServerTranslator(locale, "email");
  const tr = await getServerTranslator(locale, "email.reminder");
  const when = formatInTenantTz(b.startTime, b.tenant, "full");
  const manageUrl = await manageLink(b);
  const html = `
    <h2>${tr("heading")}</h2>
    <p>${tr("greeting", { name: escape(b.customerName) })}</p>
    <p>${tr("intro", { tenant: `<strong>${escape(b.tenant.name)}</strong>` })}</p>
    <ul>
      <li><strong>${tr("lineService")}:</strong> ${escape(b.service.name)}</li>
      ${b.staff ? `<li><strong>${tr("lineStaff")}:</strong> ${escape(b.staff.name)}</li>` : ""}
      <li><strong>${tr("lineWhen")}:</strong> ${when}</li>
    </ul>
    <p>${tr("manageCta", { url: manageUrl })}</p>
    <p>${tr("signoff")}</p>
  `;
  const resend = getResend();
  if (!resend) {
    console.log(`[email-stub] Would send reminder -> ${b.customerEmail} + ${manageUrl}`);
    return;
  }
  const from = process.env.RESEND_FROM || "bookings@example.com";
  const subject = te("subjectReminder", { service: b.service.name, when });
  await resend.emails.send({ from, to: b.customerEmail, subject, html });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]!));
}
