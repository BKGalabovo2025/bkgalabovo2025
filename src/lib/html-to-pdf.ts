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
  filename: string,
  orientation: "portrait" | "landscape" = "portrait"
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
    orientation,
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = orientation === "landscape" ? 210 : 297;
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

/**
 * Generates a PDF from an HTML element and returns it as a Base64 Data URI string.
 * This is useful for sending the PDF via email or API.
 */
export async function getPdfBase64FromElement(
  element: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<string> {
  let allCSS = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let j = 0; j < rules.length; j++) {
        allCSS += rules[j].cssText + "\n";
      }
    } catch {
      // Ignore CORS
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
      const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
      linkTags.forEach((link) => link.remove());

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
    orientation,
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = orientation === "landscape" ? 210 : 297;
  let imgWidth = pdfWidth;
  let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  if (imgHeight > pageHeight) {
    const ratio = pageHeight / imgHeight;
    imgHeight = pageHeight;
    imgWidth = imgWidth * ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);
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
  let allCSS = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let j = 0; j < rules.length; j++) {
        allCSS += rules[j].cssText + "\n";
      }
    } catch {
      // Ignore CORS
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
      const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
      linkTags.forEach((link) => link.remove());

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
    orientation,
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = orientation === "landscape" ? 210 : 297;
  let imgWidth = pdfWidth;
  let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  if (imgHeight > pageHeight) {
    const ratio = pageHeight / imgHeight;
    imgHeight = pageHeight;
    imgWidth = imgWidth * ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);
  return pdf.output("blob");
}

/**
 * Generates a PDF from an HTML element and opens it in a new browser tab for preview.
 */
export async function previewPdfFromElement(
  element: HTMLElement,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<void> {
  // Re-use logic to create jsPDF instance
  // We can just rely on the existing getPdfBase64FromElement logic to create the base64,
  // then convert it to blob, but it's cleaner to just extract the jsPDF creation if we wanted to.
  // For simplicity, we will copy the logic to return a blob directly.
  let allCSS = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let j = 0; j < rules.length; j++) {
        allCSS += rules[j].cssText + "\n";
      }
    } catch {
      // Ignore CORS
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
      const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
      linkTags.forEach((link) => link.remove());

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
    orientation,
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = orientation === "landscape" ? 210 : 297;
  let imgWidth = pdfWidth;
  let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  if (imgHeight > pageHeight) {
    const ratio = pageHeight / imgHeight;
    imgHeight = pageHeight;
    imgWidth = imgWidth * ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);

  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}
