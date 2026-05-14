import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { headers } from "next/headers";
import { Code } from "lucide-react";
import { appUrl, tenantUrl } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);

  const widgetSrc = appUrl(`/widget.js?shop=${encodeURIComponent(slug)}`);
  const directUrl = tenantUrl(slug, "/book");

  const inline = `<div data-salon-booking></div>
<script src="${widgetSrc}" async defer></script>`;

  const modal = `<button onclick="SalonBooking.open()">Book Appointment</button>
<script src="${widgetSrc}" async defer></script>`;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Embed on any website</h1>
      <p className="text-muted-foreground">
        Paste these snippets on any website. Live availability and bookings come straight from <strong>{tenant.name}</strong>.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code className="w-4 h-4" /> Inline widget</CardTitle>
          <CardDescription>Always visible on the page.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{inline}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code className="w-4 h-4" /> Modal trigger</CardTitle>
          <CardDescription>Opens in a popup when clicked.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{modal}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct booking URL</CardTitle>
          <CardDescription>Send to customers, post on social, or use as a Google Business booking link.</CardDescription>
        </CardHeader>
        <CardContent>
          <a href={directUrl} target="_blank" rel="noreferrer" className="text-primary underline break-all">{directUrl}</a>
        </CardContent>
      </Card>
    </div>
  );
}
