/**
 * Utility функции за експорт на класирания в Excel (.xlsx), PDF и CSV
 */

// ──────────────────────────────────────────────
// ТИПОВЕ
// ──────────────────────────────────────────────
export interface ExportRow {
  position: number | string;
  name: string;
  played: number;
  wins: number;
  losses: number;
  pointsRatio: string;
  winRate: string;
  totalPoints: number;
}

export interface ExportOptions {
  title: string;
  subtitle?: string;
  category?: string;
  rows: ExportRow[];
}

// ──────────────────────────────────────────────
// EXCEL EXPORT
// ──────────────────────────────────────────────
export async function exportToExcel(options: ExportOptions): Promise<void> {
  const XLSX = await import("xlsx");

  const headers = ["#", "Участник", "Изиграни", "Победи", "Загуби", "Т. Разлика", "% Победи", "Точки"];

  const data = options.rows.map(r => [
    r.position,
    r.name,
    r.played,
    r.wins,
    r.losses,
    r.pointsRatio,
    r.winRate,
    r.totalPoints,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    [options.title],
    options.subtitle ? [options.subtitle] : [],
    options.category ? [`Категория: ${options.category}`] : [],
    [],
    headers,
    ...data,
  ]);

  // Стилизираме ширините на колоните
  worksheet["!cols"] = [
    { wch: 5 },   // #
    { wch: 30 },  // Участник
    { wch: 10 },  // Изиграни
    { wch: 10 },  // Победи
    { wch: 10 },  // Загуби
    { wch: 12 },  // Т. Разлика
    { wch: 12 },  // % Победи
    { wch: 10 },  // Точки
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Класиране");

  const filename = `${options.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, "_")}_класиране.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// ──────────────────────────────────────────────
// PDF EXPORT
// ──────────────────────────────────────────────
export async function exportToPdf(options: ExportOptions): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Заглавие
  doc.setFontSize(18);
  doc.text(options.title, 14, 20);

  let yOffset = 28;

  if (options.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(options.subtitle, 14, yOffset);
    yOffset += 7;
    doc.setTextColor(0);
  }

  if (options.category) {
    doc.setFontSize(12);
    doc.setTextColor(60, 80, 200);
    doc.text(`Категория: ${options.category}`, 14, yOffset);
    yOffset += 8;
    doc.setTextColor(0);
  }

  autoTable(doc, {
    startY: yOffset,
    head: [["#", "Участник", "Изиграни", "Победи", "Загуби", "Т. Разлика", "% Победи", "Точки"]],
    body: options.rows.map(r => [
      r.position,
      r.name,
      r.played,
      r.wins,
      r.losses,
      r.pointsRatio,
      r.winRate,
      r.totalPoints,
    ]),
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        if (data.row.index === 0) data.cell.styles.fillColor = [253, 224, 71];
        if (data.row.index === 1) data.cell.styles.fillColor = [203, 213, 225];
        if (data.row.index === 2) data.cell.styles.fillColor = [253, 186, 116];
      }
    },
  });

  const filename = `${options.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, "_")}_класиране.pdf`;
  doc.save(filename);
}

/**
 * Downloads a list of objects as a CSV file.
 */
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
        return (cellValue.includes(",") || cellValue.includes("\n") || cellValue.includes('"'))
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
