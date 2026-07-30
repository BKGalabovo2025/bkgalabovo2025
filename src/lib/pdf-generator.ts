import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

export async function fillDeclarationPdf(data: {
  name: string;
  phone: string;
  date: string;
  signatureUrl?: string;
  parentSignatureUrl?: string;
}): Promise<string> {
  // Fetch the original blank PDF
  const existingPdfBytes = await fetch(
    "/declaration/Декларация за информирано съгласие BG ENG.pdf"
  ).then((res) => res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  // Register fontkit
  pdfDoc.registerFontkit(fontkit);

  // Load custom Cyrillic font
  const fontUrl = "/fonts/Roboto-Regular.ttf";
  const fontBytesRes = await fetch(fontUrl);
  const fontBytes = await fontBytesRes.arrayBuffer();
  const customFont = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  const page = pages[0]; // Assuming it's a 1-page template

  const fontSize = 12;
  const textColor = rgb(0.1, 0.2, 0.6); // Dark blue

  // Add the text overlay
  // X and Y coordinates must be tweaked to match your specific PDF template's blank fields.
  // We'll place name, phone, date, etc.
  // Note: Y is from bottom to top in PDF coordinates!

  // 1. Name
  page.drawText(data.name || "", {
    x: 280,
    y: 600,
    size: fontSize,
    font: customFont,
    color: textColor,
  });

  // 2. Phone
  page.drawText(data.phone || "", {
    x: 150,
    y: 581,
    size: fontSize,
    font: customFont,
    color: textColor,
  });

  // 3. Date
  page.drawText(data.date || "", {
    x: 480,
    y: 581,
    size: fontSize,
    font: customFont,
    color: textColor,
  });

  // Main Signature
  if (data.signatureUrl) {
    try {
      const sigImageBytes = await fetch(data.signatureUrl).then((res) =>
        res.arrayBuffer()
      );
      const sigImage = await pdfDoc.embedPng(sigImageBytes);
      const sigDims = sigImage.scale(0.25); // slightly smaller to fit well
      page.drawImage(sigImage, {
        x: 420,
        y: 80, // above Athlete Signature line
        width: sigDims.width,
        height: sigDims.height,
      });
    } catch (e) {
      console.error("Failed to embed signature:", e);
    }
  }

  // Parent Signature
  if (data.parentSignatureUrl) {
    try {
      const parentSigImageBytes = await fetch(data.parentSignatureUrl).then(
        (res) => res.arrayBuffer()
      );
      const parentSigImage = await pdfDoc.embedPng(parentSigImageBytes);
      const parentSigDims = parentSigImage.scale(0.25);
      page.drawImage(parentSigImage, {
        x: 420,
        y: 45, // above Parent Signature line
        width: parentSigDims.width,
        height: parentSigDims.height,
      });
    } catch (e) {
      console.error("Failed to embed parent signature:", e);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  return URL.createObjectURL(blob);
}
