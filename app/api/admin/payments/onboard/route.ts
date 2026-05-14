import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOnboardingLink } from "@/lib/connect";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = await getOnboardingLink(session.tenantId);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
