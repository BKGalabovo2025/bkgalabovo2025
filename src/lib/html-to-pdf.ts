import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generates a PDF from an HTML element using html2canvas and jsPDF.
 * This function also cleans up unsupported CSS colors (oklch, lab)
 * which cause html2canvas to crash or render incorrectly.
 *
 * @param element The HTML element to convert to PDF
 * @param filename The name of the resulting PDF file
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
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

  const canvas = await html2canvas(element, {
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

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = 297; // A4 height in mm
  let imgWidth = pdfWidth;
  let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  // Scale down if it exceeds one page
  if (imgHeight > pageHeight) {
    const ratio = pageHeight / imgHeight;
    imgHeight = pageHeight;
    imgWidth = imgWidth * ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);
  pdf.save(filename);
}
