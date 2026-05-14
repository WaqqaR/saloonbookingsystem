import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { prisma } from "./prisma";
import { appUrl, tenantUrl } from "./tenant";

export async function requireTenantAdmin(slug: string) {
  const session = await getSession();
  if (!session) redirect(appUrl("/login"));
  if (session.tenantSlug !== slug) {
    // Session belongs to a different tenant — bounce to their own admin.
    redirect(tenantUrl(session.tenantSlug, "/admin"));
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) redirect(appUrl("/login"));
  return { session, tenant };
}
