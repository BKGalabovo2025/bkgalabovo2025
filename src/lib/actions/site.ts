"use server";

import { revalidatePath } from "next/cache";

export async function revalidateSiteAction(targetPath?: string) {
  try {
    if (targetPath) {
      revalidatePath(targetPath);
    } else {
      revalidatePath("/recovery-zone");
      revalidatePath("/");
      revalidatePath("/settings");
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate site path:", error);
    return { success: false, error: (error as Error).message };
  }
}
