"use server";
import "server-only";

import {
  AiApiStatus,
  generateCertificateAiBackground,
  generateCertificateAiBackgroundBatch,
  GenerateCertificateAiBackgroundResult,
  getAiApiStatus,
  translateAndEnhanceBulgarianPrompt,
} from "@/lib/ai/certificate-ai-service";
import { logAuditEvent } from "@/lib/audit-logger";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminStorage } from "@/lib/firebase-admin";

/**
 * Проверява статуса на AI API ключовете от защитена сървърна среда
 */
export async function getAiApiStatusAction(): Promise<AiApiStatus> {
  return getAiApiStatus();
}

/**
 * Server Action за директна AI генерация на сертификатен фон
 */
export async function generateCertificateAiBackgroundAction(
  siteId: "bkgalabovo" | "recoveryzone",
  prompt: string,
  theme?: string,
  orientation: "landscape" | "portrait" = "landscape",
  variantIndex: number = 0
): Promise<GenerateCertificateAiBackgroundResult> {
  try {
    const user = await getAuthUserFromSessionCookie();
    const userEmail = user?.email || "admin@bkgalabovo.bg";

    const result = await generateCertificateAiBackground({
      prompt,
      theme,
      orientation,
      variantIndex,
    });

    if (!result.success || !result.imageUrl) {
      return {
        success: false,
        error: result.error || "Неуспешна AI генерация на фон.",
        providerUsed: "procedural_vector",
        variantIndex,
      };
    }

    let finalImageUrl = result.imageUrl;

    // Ако резултатът е base64 data URL (от Google Imagen 3), записваме го във Firebase Storage
    if (result.imageUrl.startsWith("data:image/")) {
      try {
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        const base64Data = result.imageUrl.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const filename = `certificate-backgrounds/ai_${Date.now()}_var${variantIndex}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        const file = bucket.file(filename);

        await file.save(buffer, {
          metadata: { contentType: "image/jpeg" },
          public: true,
        });

        finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      } catch (uploadErr) {
        console.warn(
          "Storage upload warning, keeping original URL:",
          uploadErr
        );
      }
    }

    // Одит дневник
    await logAuditEvent({
      action: "generate_ai_certificate_background",
      details: `Генериран AI сертификатен фон чрез ${result.providerUsed} (${theme || "custom"}, Вариант #${variantIndex + 1})`,
      siteId,
      metadata: {
        providerUsed: result.providerUsed,
        theme,
        variantIndex,
        userEmail,
        imageUrl: finalImageUrl.substring(0, 100),
      },
    });

    return {
      success: true,
      imageUrl: finalImageUrl,
      providerUsed: result.providerUsed,
      variantIndex,
      note: result.note,
    };
  } catch (error) {
    console.error("Грешка при generateCertificateAiBackgroundAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при AI генерация",
      providerUsed: "procedural_vector",
      variantIndex,
    };
  }
}

/**
 * Server Action за превод и оптимизиране на български промпт
 */
export async function translateBulgarianPromptAction(params: {
  bulgarianPrompt: string;
  targetAudience?: "kids" | "adults_pro" | "wellness";
  documentType?: "award" | "certificate" | "voucher";
  orientation?: "landscape" | "portrait";
}): Promise<{ englishPrompt: string; enhancedKeywords: string[] }> {
  return translateAndEnhanceBulgarianPrompt(params);
}

/**
 * Server Action за партидна AI генерация на 2-3 вариации паралелно
 */
export async function generateCertificateAiBackgroundBatchAction(
  siteId: "bkgalabovo" | "recoveryzone",
  prompt: string,
  orientation: "landscape" | "portrait" = "landscape",
  count: number = 3,
  batchOffset: number = 0,
  provider?: "auto" | "flux_neural" | "gemini_imagen" | "openai_dalle3"
): Promise<GenerateCertificateAiBackgroundResult[]> {
  try {
    const user = await getAuthUserFromSessionCookie();
    const userEmail = user?.email || "admin@bkgalabovo.bg";

    const results = await generateCertificateAiBackgroundBatch({
      prompt,
      orientation,
      count,
      batchOffset,
      provider,
    });

    // Одит запис
    await logAuditEvent({
      action: "generate_ai_certificate_background",
      details: `Генерирана партида от ${results.length} AI фона (офсет: ${batchOffset}) за ${siteId}`,
      siteId,
      metadata: {
        count: results.length,
        batchOffset,
        userEmail,
      },
    });

    return results;
  } catch (err) {
    console.error(
      "Грешка при generateCertificateAiBackgroundBatchAction:",
      err
    );
    return [];
  }
}
