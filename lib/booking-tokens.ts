import { SignJWT, jwtVerify } from "jose";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-me-in-production-please-32"
  );
}

// Customer-facing token embedded in confirmation emails. Lets them view and
// cancel their booking without an account. Long-lived (90d) to cover both
// short notice bookings and ones booked months in advance.
export async function createBookingManageToken(bookingId: string): Promise<string> {
  return await new SignJWT({ bookingId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .setSubject("booking-manage")
    .sign(secret());
}

export async function verifyBookingManageToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { subject: "booking-manage" });
    return typeof (payload as { bookingId?: unknown }).bookingId === "string"
      ? (payload as { bookingId: string }).bookingId
      : null;
  } catch {
    return null;
  }
}
