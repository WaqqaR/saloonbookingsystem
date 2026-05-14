import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StaffManager } from "./StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const staff = await prisma.staff.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: { workingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Staff</h1>
      <p className="text-sm text-muted-foreground mb-6">
        You&apos;re billed £15/month per active staff member. Adding or deactivating staff updates your subscription automatically.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Manage your team</CardTitle>
          <CardDescription>Each staff member gets their own working hours and bookable diary.</CardDescription>
        </CardHeader>
        <CardContent>
          <StaffManager initial={staff} />
        </CardContent>
      </Card>
    </div>
  );
}
