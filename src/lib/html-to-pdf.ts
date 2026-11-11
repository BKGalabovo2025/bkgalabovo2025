import type { jsPDF as JsPDFType } from "jspdf";

/**
 * Shared helper to create a jsPDF instance from an HTML element.
 * This function also cleans up unsupported CSS colors (oklch, lab)
 * which cause html2canvas to crash or render incorrectly.
 */
async function renderElementToCanvas(
  element: HTMLElement,
  cleanCSS: string
): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1024,
    windowHeight: 1200,
    onclone: (clonedDoc: Document, clonedElement?: HTMLElement) => {
      // 1. Ensure target element and all its ancestors are rendered (not display: none)
      if (clonedElement) {
        let curr: HTMLElement | null = clonedElement;
        while (curr && curr !== clonedDoc.body) {
          if (curr.style.display === "none") {
            curr.style.display = "block";
          }
          if (curr.classList.contains("hidden")) {
            curr.classList.remove("hidden");
          }
          curr = curr.parentElement;
        }
      }

      // Also unhide any hidden wrapper ancestors in the cloned document
      const hiddenParents = clonedDoc.querySelectorAll(
        ".hidden, [style*='display: none'], [style*='display:none']"
      );
      hiddenParents.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.classList.contains("hidden")) {
          htmlEl.classList.remove("hidden");
        }
        if (htmlEl.style.display === "none") {
          htmlEl.style.display = "block";
        }
      });

      // Remove dark theme so exported PDF always renders clean white print layout
      clonedDoc.documentElement.classList.remove("dark");
      clonedDoc.body.classList.remove("dark");

      // Format receipt / printable-area to exact A4 dimensions and 50/50 split matching print preview
      const printableArea = clonedElement?.classList.contains("printable-area")
        ? clonedElement
        : (clonedDoc.querySelector(".printable-area") as HTMLElement | null);

      if (printableArea) {
        printableArea.style.width = "794px";
        printableArea.style.minWidth = "794px";
        printableArea.style.maxWidth = "794px";
        printableArea.style.height = "1123px";
        printableArea.style.minHeight = "1123px";
        printableArea.style.maxHeight = "1123px";
        printableArea.style.margin = "0 auto";
        printableArea.style.padding = "26px 38px";
        printableArea.style.boxSizing = "border-box";
        printableArea.style.display = "flex";
        printableArea.style.flexDirection = "column";
        printableArea.style.justifyContent = "space-between";
        printableArea.style.borderRadius = "0";
        printableArea.style.border = "none";
        printableArea.style.boxShadow = "none";
        printableArea.style.backgroundColor = "#ffffff";
        printableArea.style.color = "#000000";
        printableArea.style.fontWeight = "400";

        const halves =
          printableArea.querySelectorAll<HTMLElement>(".receipt-half");
        halves.forEach((half) => {
          half.style.flex = "1 1 0%";
          half.style.height = "auto";
          half.style.minHeight = "0";
          half.style.maxHeight = "none";
          half.style.width = "100%";
          half.style.display = "flex";
          half.style.flexDirection = "column";
          half.style.justifyContent = "space-between";
          half.style.boxSizing = "border-box";
          half.style.overflow = "hidden";
        });

        const cards =
          printableArea.querySelectorAll<HTMLElement>(".receipt-card");
        cards.forEach((card) => {
          card.style.height = "100%";
          card.style.maxHeight = "100%";
          card.style.minHeight = "100%";
          card.style.width = "100%";
          card.style.border = "1px solid #71717a";
          card.style.borderRadius = "8px";
          card.style.padding = "12px 16px";
          card.style.display = "flex";
          card.style.flexDirection = "column";
          card.style.justifyContent = "space-between";
          card.style.boxSizing = "border-box";
          card.style.backgroundColor = "#ffffff";
          card.style.color = "#000000";
        });

        const cutLines = printableArea.querySelectorAll<HTMLElement>(
          ".cut-line-container"
        );
        cutLines.forEach((cutLine) => {
          cutLine.style.flex = "0 0 34px";
          cutLine.style.height = "34px";
          cutLine.style.maxHeight = "34px";
          cutLine.style.minHeight = "34px";
          cutLine.style.display = "flex";
          cutLine.style.alignItems = "center";
          cutLine.style.justifyContent = "center";
          cutLine.style.position = "relative";
          cutLine.style.width = "100%";
          cutLine.style.margin = "0";
          cutLine.style.padding = "0";
          cutLine.style.boxSizing = "border-box";

          const dashed = cutLine.querySelector<HTMLElement>(".border-dashed");
          if (dashed) {
            dashed.style.borderColor = "#71717a";
            dashed.style.borderTopWidth = "1px";
          }
          const label = cutLine.querySelector<HTMLElement>(".relative");
          if (label) {
            label.style.backgroundColor = "#ffffff";
            label.style.color = "#52525b";
          }
        });
      }

      // Remove original link stylesheets to avoid redownloading
      const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
      linkTags.forEach((link) => link.remove());

      // Inject cleaned CSS
      const styleEl = clonedDoc.createElement("style");
      styleEl.textContent =
        cleanCSS +
        "\n" +
        `
        /* Crisp normal typography for PDF export - avoid unreadable bold Cyrillic */
        .printable-area,
        .printable-area * {
          font-weight: 400 !important;
          color: #000000 !important;
        }
        .printable-area h2,
        .printable-area .font-medium {
          font-weight: 500 !important;
        }
        /* Clean font smoothing without forced word-spacing that causes clipping */
        html, body {
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          color: #000000 !important;
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
              "color: rgb(0, 0, 0)"
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
                "color: rgb(0, 0, 0)"
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
): Promise<JsPDFType> {
  const { jsPDF } = await import("jspdf");
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
      "color: rgb(0, 0, 0)"
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
  const childPages = Array.from(
    element.querySelectorAll<HTMLElement>(".pdf-page")
  );
  const explicitPages =
    childPages.length > 0
      ? childPages
      : element.classList.contains("pdf-page")
        ? [element]
        : [];

  if (explicitPages.length > 0) {
    for (let i = 0; i < explicitPages.length; i++) {
      const pageEl = explicitPages[i];
      if (i > 0) {
        pdf.addPage();
      }
      const pageCanvas = await renderElementToCanvas(pageEl, cleanCSS);
      if (!pageCanvas || pageCanvas.width === 0 || pageCanvas.height === 0) {
        throw new Error(
          "Неуспешно генериране на PDF: елементът на страницата няма видими размери (0x0)."
        );
      }
      const imgData = pageCanvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    }
    return pdf;
  }

  // Fallback for single container: paginate across multiple pages without squishing
  const canvas = await renderElementToCanvas(element, cleanCSS);
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error(
      "Неуспешно генериране на PDF: документът няма видими размери (0x0)."
    );
  }
  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pdfWidth;
  const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Толеранс 2 мм: 297 мм мин-височина се рендира като ~297.0x мм и без толеранс се получава празна втора страница
  while (heightLeft > 2) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
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
