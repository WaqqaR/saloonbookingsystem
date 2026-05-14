import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { startTime, endTime, reason, staffId } = await req.json();
  const block = await prisma.blockedTime.create({
    data: {
      tenantId: session.tenantId,
      staffId: staffId || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      reason,
    },
  });
  return NextResponse.json({ block });
}
