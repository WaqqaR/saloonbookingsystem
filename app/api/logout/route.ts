import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { appUrl } from "@/lib/tenant";

export async function POST() {
  await destroySession();
  return NextResponse.json({ redirect: appUrl("/") });
}
