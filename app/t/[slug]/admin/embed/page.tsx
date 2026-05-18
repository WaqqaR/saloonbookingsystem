import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { headers } from "next/headers";
import { Code } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { appUrl, tenantUrl } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.embed");

  const widgetSrc = appUrl(`/widget.js?shop=${encodeURIComponent(slug)}`);
  const directUrl = tenantUrl(slug, "/book");

  const inline = `<div data-salon-booking></div>
<script src="${widgetSrc}" async defer></script>`;

  const modal = `<button onclick="SalonBooking.open()">Book Appointment</button>
<script src="${widgetSrc}" async defer></script>`;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">
        {t.rich("intro", {
          tenant: tenant.name,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code className="w-4 h-4" /> {t("inlineTitle")}</CardTitle>
          <CardDescription>{t("inlineDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{inline}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code className="w-4 h-4" /> {t("modalTitle")}</CardTitle>
          <CardDescription>{t("modalDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{modal}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("directTitle")}</CardTitle>
          <CardDescription>{t("directDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <a href={directUrl} target="_blank" rel="noreferrer" className="text-primary underline break-all">{directUrl}</a>
        </CardContent>
      </Card>
    </div>
  );
}
