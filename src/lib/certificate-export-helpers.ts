"use client";

import html2canvas from "html2canvas";

import { generatePdfFromElement } from "@/lib/html-to-pdf";

export type CertificateExportResolution = "standard" | "ultra_300dpi";

/**
 * Експортира сертификата / ваучера като PNG изображение
 * standard = 2x scale (Full HD, идеално за споделяне)
 * ultra_300dpi = 4x scale (300+ DPI, кристал за печатница)
 */
export async function exportCertificatePng(
  elementId = "printable-certificate",
  filename = "certificate.png",
  resolution: CertificateExportResolution = "ultra_300dpi"
): Promise<boolean> {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Елемент с id "${elementId}" не е намерен.`);
      return false;
    }

    const scale = resolution === "ultra_300dpi" ? 4 : 2;

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename.endsWith(".png")
          ? filename
          : `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve(true);
      }, "image/png");
    });
  } catch (error) {
    console.error("Грешка при експорт на PNG:", error);
    return false;
  }
}

/**
 * Експортира сертификата / ваучера като векторен A4 PDF документ
 */
export async function exportCertificatePdf(
  elementId = "printable-certificate",
  filename = "certificate.pdf",
  orientation: "landscape" | "portrait" = "landscape"
): Promise<boolean> {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Елемент с id "${elementId}" не е намерен.`);
      return false;
    }

    const finalFilename = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;
    await generatePdfFromElement(el, finalFilename, orientation);
    return true;
  } catch (error) {
    console.error("Грешка при експорт на PDF:", error);
    return false;
  }
}

/**
 * Експортира двустранен документ като 2-страничен PDF (Страница 1 = Лице, Страница 2 = Гръб)
 */
export async function exportTwoPageCertificatePdf(
  frontElementId = "printable-certificate",
  backElementId = "printable-certificate-back",
  filename = "certificate-double-sided.pdf",
  orientation: "landscape" | "portrait" = "landscape"
): Promise<boolean> {
  try {
    const frontEl = document.getElementById(frontElementId);
    const backEl = document.getElementById(backElementId);

    if (!frontEl) {
      console.error(`Лицевият елемент с id "${frontElementId}" не е намерен.`);
      return false;
    }

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 1. Capture Front Page
    const frontCanvas = await html2canvas(frontEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const frontImg = frontCanvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(
      frontImg,
      "JPEG",
      0,
      0,
      pageWidth,
      pageHeight,
      undefined,
      "FAST"
    );

    // 2. Capture Back Page if present
    if (backEl) {
      const backCanvas = await html2canvas(backEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const backImg = backCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addPage(undefined, orientation);
      pdf.addImage(
        backImg,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST"
      );
    }

    const finalFilename = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;
    pdf.save(finalFilename);
    return true;
  } catch (error) {
    console.error("Грешка при експорт на 2-страничен PDF:", error);
    return false;
  }
}

/**
 * Задейства директен A4 печат през браузъра
 */
export function printCertificate(): void {
  window.print();
}

/**
 * 📦 Масов експорт на няколко сертификата в един общ многостраничен A4 PDF
 */
export async function exportBatchMultiCertificatePdf(
  elements: HTMLElement[],
  filename = "certificates-batch.pdf",
  orientation: "landscape" | "portrait" = "landscape",
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  if (!elements || elements.length === 0) {
    console.error("Няма подадени елементи за масов PDF експорт.");
    return false;
  }

  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < elements.length; i++) {
      if (onProgress) {
        onProgress(i + 1, elements.length);
      }

      if (i > 0) {
        pdf.addPage(undefined, orientation);
      }

      const canvas = await html2canvas(elements[i], {
        scale: 2.5, // Висока резолюция
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST"
      );
    }

    const finalFilename = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;
    pdf.save(finalFilename);
    return true;
  } catch (error) {
    console.error("Грешка при масов PDF експорт:", error);
    return false;
  }
}

/**
 * 📲 Генериране на бързи връзки за споделяне (WhatsApp, Viber, Имейл)
 */
export function getCertificateShareLinks(data: {
  recipientName: string;
  serialNumber: string;
  title: string;
  verificationUrl: string;
}) {
  const textMessage = `🏸 Официално отличие от БК Гълъбово!\n\nПоздравления за ${data.recipientName} за връчения документ "${data.title}" (№ ${data.serialNumber})!\n\nВижте и проверете дигиталния сертификат тук:\n${data.verificationUrl}`;
  const encodedText = encodeURIComponent(textMessage);
  const encodedSubject = encodeURIComponent(
    `Официално отличие от БК Гълъбово: ${data.recipientName}`
  );

  return {
    text: textMessage,
    whatsAppUrl: `https://api.whatsapp.com/send?text=${encodedText}`,
    viberUrl: `viber://forward?text=${encodedText}`,
    emailUrl: `mailto:?subject=${encodedSubject}&body=${encodedText}`,
  };
}

/**
 * 🚀 Нативно Web Share API споделяне (за смартфони и таблети)
 */
export async function shareCertificateViaWeb(data: {
  recipientName: string;
  serialNumber: string;
  title: string;
  verificationUrl: string;
}): Promise<boolean> {
  const shareLinks = getCertificateShareLinks(data);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `Отличие: ${data.recipientName} - БК Гълъбово`,
        text: shareLinks.text,
        url: data.verificationUrl,
      });
      return true;
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return false;
      console.warn(
        "Web Share API грешка, преминаване към алтернативно копиране:",
        err
      );
    }
  }

  // Fallback: копиране на текста в клипборда
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(shareLinks.text);
    return true;
  }
  return false;
}
