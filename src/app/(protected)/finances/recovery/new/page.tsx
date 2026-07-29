import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";
import NewRecoverySessionClient from "@/app/(protected)/finances/recovery/new/client-page";

export const dynamic = "force-dynamic";

export default async function NewRecoverySessionPage() {
  const site = await getSiteByIdAdmin("recoveryzone");

  const siteInventory = site?.inventory
    ? {
        compressors: site.inventory.compressors || 0,
        attachments: {
          arms: site.inventory.attachments?.arms || 0,
          legs: site.inventory.attachments?.legs || 0,
          hips: site.inventory.attachments?.hips || 0,
        },
      }
    : undefined;

  return <NewRecoverySessionClient siteInventory={siteInventory} />;
}
