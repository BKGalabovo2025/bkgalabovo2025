import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Shared helper to create a jsPDF instance from an HTML element.
 * This function also cleans up unsupported CSS colors (oklch, lab)
 * which cause html2canvas to crash or render incorrectly.
 */
async function renderElementToCanvas(
  element: HTMLElement,
  cleanCSS: string
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc: Document) => {
      // Remove original link stylesheets to avoid redownloading
      const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
      linkTags.forEach((link) => link.remove());

      // Inject cleaned CSS
      const styleEl = clonedDoc.createElement("style");
      styleEl.textContent =
        cleanCSS +
        "\n" +
        `
        * {
          font-family: Arial, Helvetica, sans-serif !important;
          word-spacing: 2px !important;
        }
      `;
      clonedDoc.head.appendChild(styleEl);

      // Clean existing style tags
      const styleTags = clonedDoc.querySelectorAll("style");
      styleTags.forEach((style) => {
        if (style.innerHTML) {
          style.innerHTML = style.innerHTML
            .replace(
              /color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
              "color: rgb(15, 23, 42)"
            )
            .replace(
              /background-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
              "background-color: transparent"
            )
            .replace(
              /border-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
              "border-color: rgb(203, 213, 225)"
            )
            .replace(/(?:lab|oklch|lch|oklab)\([^)]+\)/gi, "inherit");
        }
      });

      // Clean inline styles
      const allElements = clonedDoc.querySelectorAll("*");
      allElements.forEach((el) => {
        const styleAttr = el.getAttribute("style");
        if (styleAttr && /(?:lab|oklch|lch|oklab)/i.test(styleAttr)) {
          el.setAttribute(
            "style",
            styleAttr
              .replace(
                /color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                "color: rgb(15, 23, 42)"
              )
              .replace(
                /background-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                "background-color: transparent"
              )
              .replace(
                /border-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
                "border-color: rgb(203, 213, 225)"
              )
              .replace(/(?:lab|oklch|lch|oklab)\([^)]+\)/gi, "inherit")
          );
        }
      });
    },
  });
}

/**
 * Shared helper to create a jsPDF instance from an HTML element.
 * Supports multi-page PDF generation via .pdf-page elements or paginated canvas slicing.
 */
async function createPdf(
  element: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<jsPDF> {
  // 1. Gather all active CSS rules and remove unsupported colors
  let allCSS = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let j = 0; j < rules.length; j++) {
        allCSS += rules[j].cssText + "\n";
      }
    } catch {
      // Ignore CORS protected stylesheets
    }
  }

  const cleanCSS = allCSS
    .replace(
      /color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
      "color: rgb(15, 23, 42)"
    )
    .replace(
      /background-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
      "background-color: transparent"
    )
    .replace(
      /border-color:\s*(?:lab|oklch|lch|oklab)\([^)]+\)/gi,
      "border-color: rgb(203, 213, 225)"
    )
    .replace(/(?:lab|oklch|lch|oklab)\([^)]+\)/gi, "inherit");

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Check if the container explicitly defines multiple .pdf-page sections
  const explicitPages = Array.from(
    element.querySelectorAll<HTMLElement>(".pdf-page")
  );

  if (explicitPages.length > 0) {
    for (let i = 0; i < explicitPages.length; i++) {
      const pageEl = explicitPages[i];
      if (i > 0) {
        pdf.addPage();
      }
      const pageCanvas = await renderElementToCanvas(pageEl, cleanCSS);
      const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    }
    return pdf;
  }

  // Fallback for single container: paginate across multiple pages without squishing
  const canvas = await renderElementToCanvas(element, cleanCSS);
  const imgData = canvas.toDataURL("image/png");
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pdfWidth;
  const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  return pdf;
}

/**
 * Generates a PDF from an HTML element using html2canvas and jsPDF.
 *
 * @param element The HTML element to convert to PDF
 * @param filename The name of the resulting PDF file
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<void> {
  const pdf = await createPdf(element, orientation);
  pdf.save(filename);
}

/**
 * Generates a PDF from an HTML element and returns it as a Base64 Data URI string.
 * This is useful for sending the PDF via email or API.
 */
export async function getPdfBase64FromElement(
  element: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<string> {
  const pdf = await createPdf(element, orientation);
  return pdf.output("datauristring");
}

/**
 * Generates a PDF from an HTML element and returns it as a Blob.
 * This is useful for adding the PDF to a ZIP archive.
 */
export async function getPdfBlobFromElement(
  element: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<Blob> {
  const pdf = await createPdf(element, orientation);
  return pdf.output("blob");
}

/**
 * Generates a PDF from an HTML element and opens it in a new browser tab for preview.
 */
export async function previewPdfFromElement(
  element: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<void> {
  const pdf = await createPdf(element, orientation);
  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}
