"use server";
import "server-only";

import QRCode from "qrcode";

import { logAuditEvent } from "@/lib/audit-logger";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  CertificateTemplate,
  generateCertificateSerialNumber,
  IssueCertificateInput,
  IssuedCertificate,
  SponsorPartner,
  VoucherStatus,
} from "@/types/certificates";

const CERTIFICATES_COLLECTION = "certificates";
const TEMPLATES_COLLECTION = "certificate_templates";
const SPONSORS_COLLECTION = "sponsors";

/**
 * Издава нов персонален сертификат/грамота/ваучер
 */
export async function issueCertificateAction(
  siteId: "bkgalabovo" | "recoveryzone",
  input: IssueCertificateInput
): Promise<{ success: boolean; data?: IssuedCertificate; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const user = await getAuthUserFromSessionCookie();
    const issuerEmail = user?.email || "admin@bkgalabovo.bg";
    const issuerName = user?.name || "Клубен Администратор";

    // 1. Извличане на шаблона
    let templateData: CertificateTemplate | null = null;
    const templateDoc = await adminDb
      .collection(TEMPLATES_COLLECTION)
      .doc(input.templateId)
      .get();

    if (templateDoc.exists) {
      templateData = {
        id: templateDoc.id,
        ...(templateDoc.data() as Omit<CertificateTemplate, "id">),
      };
    }

    // 2. Генериране на уникален сериен номер за текущата година (BKG-2026-XXXX / RZ-2026-XXXX)
    const serialNumber = generateCertificateSerialNumber(siteId);

    // 3. Извличане на спонсорите за замразяване в snapshot
    const sponsorsSnapshot = await adminDb
      .collection(SPONSORS_COLLECTION)
      .where("siteId", "==", siteId)
      .get();

    const allSponsors: SponsorPartner[] = sponsorsSnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<SponsorPartner, "id">),
    }));

    // Филтриране на активните спонсори от визуалната конфигурация
    const selectedSponsors = allSponsors.filter((sp) => {
      if (
        templateData?.visualConfig.selectedSponsorIds &&
        templateData.visualConfig.selectedSponsorIds.length > 0
      ) {
        return templateData.visualConfig.selectedSponsorIds.includes(sp.id);
      }
      return sp.isActive;
    });

    // 4. Генериране на временен ID и URL за QR код
    const docRef = adminDb.collection(CERTIFICATES_COLLECTION).doc();
    const certificateId = docRef.id;

    // Публичен URL за верификация: напр. /recovery-zone?verify=... или /club?verify=...
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "https://bkgalabovo2025.vercel.app";
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const publicValidationUrl =
      siteId === "recoveryzone" || input.type === "voucher"
        ? `${cleanBaseUrl}/recovery-zone?verify=${encodeURIComponent(serialNumber)}`
        : `${cleanBaseUrl}/club?verify=${encodeURIComponent(serialNumber)}`;

    // 5. Генериране на QR код като base64 Data URL с библиотеката qrcode
    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(publicValidationUrl, {
        margin: 1,
        width: 256,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (qrErr) {
      console.warn("Грешка при генериране на QR код с qrcode:", qrErr);
    }

    // 6. Подготовка на данните за ваучер
    const isVoucher = input.type === "voucher";
    const totalSessions =
      input.details.totalSessions ?? templateData?.defaultTotalSessions ?? 1;
    const remainingSessions = isVoucher ? totalSessions : undefined;
    const voucherStatus: VoucherStatus | undefined = isVoucher
      ? "active"
      : undefined;

    // Срок на валидност
    let validUntil = input.details.validUntil;
    if (isVoucher && !validUntil) {
      const days = templateData?.defaultValidityDays ?? 180;
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      validUntil = expDate.toISOString();
    }

    const now = new Date().toISOString();

    const newCertificate: IssuedCertificate = {
      id: certificateId,
      siteId,
      templateId: input.templateId,
      type: input.type,
      serialNumber,
      recipient: input.recipient,
      details: {
        ...input.details,
        totalSessions: isVoucher ? totalSessions : undefined,
        usedSessions: 0,
        remainingSessions,
        validUntil,
        voucherStatus,
        usageLog: [],
      },
      visualSnapshot: {
        ...(templateData?.visualConfig || {
          orientation: "landscape",
          themeColor: "#1E3A8A",
          secondaryColor: "#D97706",
          backgroundColor: "#FFFFFF",
          frameStyle: "classic_gold",
          layoutTemplate: "official_award",
          selectedSponsorIds: [],
          signatoryName: "Димитър Иванов",
          signatoryTitle: "Председател",
          showBadge: true,
        }),
        templateTitle: templateData?.title || "Официален Клубен Документ",
        sponsors: selectedSponsors.map((s) => ({
          name: s.name,
          logoUrl: s.logoUrl,
          websiteUrl: s.websiteUrl,
        })),
      },
      qrCodeDataUrl,
      issuedAt: now,
      issuedByEmail: issuerEmail,
      issuedByName: issuerName,
    };

    // 7. Запис в базата данни (санизиране на undefined стойности за Firestore Admin)
    const sanitizedCertificate = JSON.parse(JSON.stringify(newCertificate));
    await docRef.set(sanitizedCertificate);

    // 8. Логване в одит системата
    let docTypeLabel = "сертификат";
    if (input.type === "voucher") {
      docTypeLabel = "ваучер";
    } else if (input.type === "award") {
      docTypeLabel = "грамота";
    }

    await logAuditEvent({
      action: "issue_certificate",
      details: `Издаден ${docTypeLabel} на ${input.recipient.name} с № ${serialNumber}`,
      siteId,
      metadata: {
        certificateId,
        serialNumber,
        recipientName: input.recipient.name,
        recipientInstitution: input.recipient.institution,
        type: input.type,
      },
    });

    return { success: true, data: newCertificate };
  } catch (error) {
    console.error("Грешка при issueCertificateAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Неуспешно издаване на сертификат",
    };
  }
}

/**
 * Извлича всички издадени документи за даден клуб
 */
export async function getIssuedCertificatesAction(
  siteId: "bkgalabovo" | "recoveryzone"
): Promise<{ success: boolean; data: IssuedCertificate[]; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection(CERTIFICATES_COLLECTION)
      .where("siteId", "==", siteId)
      .orderBy("issuedAt", "desc")
      .get();

    const items: IssuedCertificate[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<IssuedCertificate, "id">),
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("Грешка при getIssuedCertificatesAction:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на регистъра",
    };
  }
}

/**
 * Публично или администраторско извличане на документ по ID или сериен номер за страница /cert/[id]
 */
export async function getCertificateByIdAction(
  idOrSerial: string
): Promise<{ success: boolean; data?: IssuedCertificate; error?: string }> {
  try {
    const adminDb = getAdminDb();
    // 1. Директно търсене по Firestore Document ID
    const doc = await adminDb
      .collection(CERTIFICATES_COLLECTION)
      .doc(idOrSerial)
      .get();
    if (doc.exists) {
      return {
        success: true,
        data: { id: doc.id, ...(doc.data() as Omit<IssuedCertificate, "id">) },
      };
    }

    // 2. Вторичен опит: търсене по serialNumber
    const snap = await adminDb
      .collection(CERTIFICATES_COLLECTION)
      .where("serialNumber", "==", idOrSerial)
      .limit(1)
      .get();

    if (!snap.empty) {
      const foundDoc = snap.docs[0];
      return {
        success: true,
        data: {
          id: foundDoc.id,
          ...(foundDoc.data() as Omit<IssuedCertificate, "id">),
        },
      };
    }

    return { success: false, error: "Документът не е намерен в регистъра." };
  } catch (error) {
    console.error("Грешка при getCertificateByIdAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при търсене на документ",
    };
  }
}

/**
 * Отчитане / Осребряване на сесия от ваучер
 */
export async function redeemVoucherSessionAction(
  certificateId: string,
  note?: string
): Promise<{ success: boolean; updated?: IssuedCertificate; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const user = await getAuthUserFromSessionCookie();
    const staffEmail = user?.email || "staff@bkgalabovo.bg";
    const staffName = user?.name || "Служител";

    const docRef = adminDb
      .collection(CERTIFICATES_COLLECTION)
      .doc(certificateId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Ваучерът не беше намерен." };
    }

    const cert = docSnap.data() as IssuedCertificate;

    if (cert.type !== "voucher") {
      return { success: false, error: "Документът не е от тип ваучер." };
    }

    const currentUsed = cert.details.usedSessions || 0;
    const total = cert.details.totalSessions || 1;

    if (currentUsed >= total) {
      return {
        success: false,
        error: "Всички процедури от този ваучер вече са изразходени!",
      };
    }

    const newUsed = currentUsed + 1;
    const newRemaining = Math.max(0, total - newUsed);
    const newStatus: VoucherStatus =
      newRemaining === 0 ? "fully_used" : "active";

    const newLogItem = {
      date: new Date().toISOString(),
      markedByEmail: staffEmail,
      markedByName: staffName,
      sessionNumber: newUsed,
      note: note || `Процедура #${newUsed} отбелязана от ${staffName}`,
    };

    const updatedDetails = {
      ...cert.details,
      usedSessions: newUsed,
      remainingSessions: newRemaining,
      voucherStatus: newStatus,
      usageLog: [...(cert.details.usageLog || []), newLogItem],
    };

    await docRef.update({
      details: JSON.parse(JSON.stringify(updatedDetails)),
    });

    const updatedCert: IssuedCertificate = {
      ...cert,
      details: updatedDetails,
    };

    // Одит дневник
    await logAuditEvent({
      action: "redeem_voucher_session",
      details: `Осребрена процедура #${newUsed} от ваучер № ${cert.serialNumber} (${cert.recipient.name})`,
      siteId: cert.siteId,
      metadata: {
        certificateId,
        sessionNumber: newUsed,
        remaining: newRemaining,
        recipientName: cert.recipient.name,
      },
    });

    return { success: true, updated: updatedCert };
  } catch (error) {
    console.error("Грешка при redeemVoucherSessionAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при отчитане на процедура",
    };
  }
}

/**
 * Изтриване на издаден документ от регистъра
 */
export async function deleteIssuedCertificateAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection(CERTIFICATES_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Грешка при deleteIssuedCertificateAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при изтриване",
    };
  }
}
