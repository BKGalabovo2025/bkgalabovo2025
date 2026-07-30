/**
 * Унифицирани utility функции за експорт в Excel (.xlsx), PDF и CSV
 */

// ──────────────────────────────────────────────
// ОБЩИ ТИПОВЕ ЗА ЕКСПОРТ
// ──────────────────────────────────────────────
export interface ExportColumn {
  header: string;
  key: string;
  width?: number; // Ширина за Excel (напр. 15)
  align?: "left" | "center" | "right";
  isCurrency?: boolean;
}

export interface GenericExportOptions {
  title: string;
  subtitle?: string;
  metaData?: string; // напр. "Категория: Мъже" или "Период: 2024"
  columns: ExportColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  totalLabel?: string;
  totalValue?: number;
  filenamePrefix?: string;
}

// ──────────────────────────────────────────────
// EXCEL EXPORT
// ──────────────────────────────────────────────
export async function generateExcelReport(
  options: GenericExportOptions
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Отчет");

  let currentRow = 1;

  // 1. Заглавие
  worksheet.getCell(`A${currentRow}`).value = options.title;
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  currentRow++;

  if (options.subtitle) {
    worksheet.getCell(`A${currentRow}`).value = options.subtitle;
    worksheet.getCell(`A${currentRow}`).font = { italic: true };
    currentRow++;
  }

  if (options.metaData) {
    worksheet.getCell(`A${currentRow}`).value = options.metaData;
    currentRow++;
  }

  currentRow++; // Празен ред

  // 2. Заглавия на колоните
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = options.columns.map((c) => c.header);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };
  currentRow++;

  // 3. Данни
  options.data.forEach((rowObj) => {
    worksheet.getRow(currentRow).values = options.columns.map(
      (c) => rowObj[c.key]
    );
    currentRow++;
  });

  // 4. Общо (ако има)
  if (options.totalLabel && options.totalValue !== undefined) {
    const totalRow = worksheet.getRow(currentRow);
    // Слагаме тотала в последната колона
    const values = new Array(options.columns.length).fill("");
    values[options.columns.length - 2] = options.totalLabel;
    values[options.columns.length - 1] = options.totalValue;
    totalRow.values = values;
    totalRow.font = { bold: true };
    if (options.columns[options.columns.length - 1].isCurrency) {
      totalRow.getCell(options.columns.length).numFmt = "0.00";
    }
  }

  // 5. Ширини на колоните
  worksheet.columns = options.columns.map((c) => ({
    key: c.key,
    width: c.width || 15,
  }));

  // Генериране и изтегляне
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const prefix = options.filenamePrefix || "Export";
  anchor.download = `${prefix}_${new Date().getTime()}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────
// PDF EXPORT
// ──────────────────────────────────────────────
export async function generatePdfReport(
  options: GenericExportOptions
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1000px";
  container.style.backgroundColor = "white";
  container.style.padding = "40px";
  container.style.fontFamily = "sans-serif";

  // Генериране на <thead>
  const theadHtml = options.columns
    .map(
      (c) =>
        `<th style="padding: 10px; border: 1px solid #ddd; text-align: ${c.align || "left"};">${c.header}</th>`
    )
    .join("");

  // Генериране на <tbody>
  const tbodyHtml = options.data
    .map((rowObj, idx) => {
      const trBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cellsHtml = options.columns
        .map((c) => {
          let val = rowObj[c.key];
          if (c.isCurrency && typeof val === "number") {
            val = val.toFixed(2);
          }
          return `<td style="padding: 10px; border: 1px solid #ddd; text-align: ${c.align || "left"};">${val}</td>`;
        })
        .join("");
      return `<tr style="background-color: ${trBg};">${cellsHtml}</tr>`;
    })
    .join("");

  // Генериране на Тотал ред
  let totalHtml = "";
  if (options.totalLabel && options.totalValue !== undefined) {
    const colspan = options.columns.length - 1;
    totalHtml = `
      <tr style="background-color: #e2e8f0; font-weight: bold; font-size: 14px;">
        <td colspan="${colspan}" style="padding: 10px; border: 1px solid #ddd; text-align: right;">${options.totalLabel}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #16a34a;">${options.totalValue.toFixed(2)} лв.</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <h1 style="font-size: 24px; margin-bottom: 5px; color: #1a1a1a;">${options.title}</h1>
    ${options.subtitle ? `<p style="font-size: 14px; color: #666; margin-bottom: 5px;">${options.subtitle}</p>` : ""}
    ${options.metaData ? `<p style="font-size: 16px; color: #3e40c8; margin-bottom: 20px;">${options.metaData}</p>` : ""}
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background-color: #1e40af; color: white;">
          ${theadHtml}
        </tr>
      </thead>
      <tbody>
        ${tbodyHtml}
        ${totalHtml}
      </tbody>
    </table>
    <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
      Генерирано от Бадминтон клуб Гълъбово Management System • ${new Date().toLocaleDateString("bg-BG")}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    doc.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

    const prefix = options.filenamePrefix || "Export";
    doc.save(`${prefix}_${new Date().getTime()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ──────────────────────────────────────────────
// CSV EXPORT
// ──────────────────────────────────────────────
export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string = "export.csv"
) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        const val = obj[header];
        if (val === null || val === undefined) return "";
        const cellValue = String(val).replace(/"/g, '""');
        return cellValue.includes(",") ||
          cellValue.includes("\n") ||
          cellValue.includes('"')
          ? `"${cellValue}"`
          : cellValue;
      })
      .join(",")
  );
  const csvString = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.click();
};
