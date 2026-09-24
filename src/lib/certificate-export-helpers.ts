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
