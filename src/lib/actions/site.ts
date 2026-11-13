"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { ensureAdminFromSession } from "@/lib/auth-utils";
import { serverCache } from "@/lib/server-cache";

export async function revalidateSiteAction(targetPath?: string) {
  try {
    await ensureAdminFromSession();

    serverCache.invalidate("site:recoveryzone");
    serverCache.invalidate("club:public-data");
    revalidateTag("sites", "max");

    revalidatePath("/club");
    revalidatePath("/club/team");
    revalidatePath("/recovery-zone");
    revalidatePath("/recovery-zone/catalog");

    if (targetPath) {
      revalidatePath(targetPath);
    } else {
      revalidatePath("/");
      revalidatePath("/settings");
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate site path:", error);
    return { success: false, error: (error as Error).message };
  }
}
