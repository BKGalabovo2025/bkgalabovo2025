"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";

const GeneralServiceSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа."),
  price: z.coerce.number().min(0, "Цената трябва да е положително число."),
  currency: z.string().default("EUR"),
  description: z.string().optional().default(""),
  performerName: z.string().min(2, "Изпълнителят трябва да е поне 2 символа."),
  performerType: z.enum(["internal", "external"]),
  pricingUnit: z.enum(["fixed", "per_hour", "per_session"]),
});

export type GeneralServiceState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
};

export async function createGeneralService(
  idToken: string,
  _prevState: GeneralServiceState,
  formData: FormData
): Promise<GeneralServiceState> {
  try {
    if (!idToken) throw new Error("Missing ID Token");
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const rawData = {
      name: formData.get("name") as string,
      price: formData.get("price"),
      currency: (formData.get("currency") as string) || "EUR",
      description: (formData.get("description") as string) || "",
      performerName: formData.get("performerName") as string,
      performerType: formData.get("performerType") as string,
      pricingUnit: formData.get("pricingUnit") as string,
    };

    const validatedFields = GeneralServiceSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка във валидацията.",
      };
    }

    const data = validatedFields.data;
    const serviceId = `gs_${Date.now()}`;

    await adminDb
      .collection("clubGeneralServices")
      .doc(serviceId)
      .set({
        ...data,
        id: serviceId,
        siteId: user.siteId || "bkgalabovo",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: {
          userId: user.uid,
          userName: user.displayName || user.email,
        },
      });

    revalidatePath("/finances/general-services");
    return {
      success: true,
      message: `Услугата '${data.name}' беше създадена успешно.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Грешка при сървъра: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

export async function updateGeneralService(
  id: string,
  idToken: string,
  _prevState: GeneralServiceState,
  formData: FormData
): Promise<GeneralServiceState> {
  try {
    if (!id || !idToken) throw new Error("Missing ID or ID Token");
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const rawData = {
      name: formData.get("name") as string,
      price: formData.get("price"),
      currency: (formData.get("currency") as string) || "EUR",
      description: (formData.get("description") as string) || "",
      performerName: formData.get("performerName") as string,
      performerType: formData.get("performerType") as string,
      pricingUnit: formData.get("pricingUnit") as string,
    };

    const validatedFields = GeneralServiceSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка във валидацията.",
      };
    }

    const data = validatedFields.data;

    await adminDb
      .collection("clubGeneralServices")
      .doc(id)
      .update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: {
          userId: user.uid,
          userName: user.displayName || user.email,
        },
      });

    revalidatePath("/finances/general-services");
    return {
      success: true,
      message: `Услугата '${data.name}' беше обновена успешно.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Грешка при сървъра: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

export async function deleteGeneralService(idToken: string, id: string) {
  try {
    if (!idToken) throw new Error("Missing ID Token");
    const adminDb = getAdminDb();
    await adminDb.collection("clubGeneralServices").doc(id).delete();

    revalidatePath("/finances/general-services");
    return { success: true, message: "Услугата беше изтрита успешно." };
  } catch (error) {
    return {
      success: false,
      message: `Грешка при изтриване: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}
