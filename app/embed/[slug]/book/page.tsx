import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/booking-flow";

export const dynamic = "force-dynamic";

export default async function EmbedBook({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();
  return (
    <div className="bg-transparent p-4 max-w-3xl mx-auto">
      <BookingFlow embed tenantSlug={slug} currency={tenant.currency} locale={tenant.defaultLocale} timezone={tenant.timezone} />
    </div>
  );
}
