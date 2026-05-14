import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-medium mb-2">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Studio details</CardTitle>
          <CardDescription>How customers see your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initial={{
              name: tenant.name,
              email: tenant.email,
              phone: tenant.phone || "",
              timezone: tenant.timezone,
              currency: tenant.currency,
              cancellationWindowHours: tenant.cancellationWindowHours,
              noShowFeePercent: tenant.noShowFeePercent,
              emailRemindersEnabled: tenant.emailRemindersEnabled,
              smsRemindersEnabled: tenant.smsRemindersEnabled,
              reminderHoursBefore: tenant.reminderHoursBefore,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
