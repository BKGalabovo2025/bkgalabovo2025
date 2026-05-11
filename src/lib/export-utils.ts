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
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Класиране");

  // Заглавни редове
  let currentRow = 1;
  worksheet.getCell(`A${currentRow}`).value = options.title;
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  currentRow++;

  if (options.subtitle) {
    worksheet.getCell(`A${currentRow}`).value = options.subtitle;
    worksheet.getCell(`A${currentRow}`).font = { italic: true };
    currentRow++;
  }

  if (options.category) {
    worksheet.getCell(`A${currentRow}`).value =
      `Категория: ${options.category}`;
    currentRow++;
  }

  currentRow++; // Празен ред

  // Заглавия на колоните
  const headers = [
    "#",
    "Участник",
    "Изиграни",
    "Победи",
    "Загуби",
    "Т. Разлика",
    "% Победи",
    "Точки",
  ];
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = headers;
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };
  currentRow++;

  // Данни
  options.rows.forEach((r) => {
    worksheet.getRow(currentRow).values = [
      r.position,
      r.name,
      r.played,
      r.wins,
      r.losses,
      r.pointsRatio,
      r.winRate,
      r.totalPoints,
    ];
    currentRow++;
  });

  // Ширини на колоните
  worksheet.columns = [
    { key: "pos", width: 5 },
    { key: "name", width: 30 },
    { key: "played", width: 12 },
    { key: "wins", width: 10 },
    { key: "losses", width: 10 },
    { key: "ratio", width: 15 },
    { key: "rate", width: 12 },
    { key: "points", width: 10 },
  ];

  // Генериране и изтегляне
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${options.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, "_")}_класиране.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────
// PDF EXPORT
// ──────────────────────────────────────────────
export async function exportToPdf(options: ExportOptions): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  // Създаваме временен скрит елемент за рендиране
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1000px"; // Фиксирана ширина за по-добро качество
  container.style.backgroundColor = "white";
  container.style.padding = "40px";
  container.style.fontFamily = "sans-serif";

  container.innerHTML = `
    <h1 style="font-size: 24px; margin-bottom: 5px; color: #1a1a1a;">${options.title}</h1>
    ${options.subtitle ? `<p style="font-size: 14px; color: #666; margin-bottom: 5px;">${options.subtitle}</p>` : ""}
    ${options.category ? `<p style="font-size: 16px; color: #3e40c8; margin-bottom: 20px;">Категория: ${options.category}</p>` : ""}
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background-color: #1e40af; color: white;">
          <th style="padding: 10px; border: 1px solid #ddd;">#</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Участник</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Изиграни</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Победи</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Загуби</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Т. Разлика</th>
          <th style="padding: 10px; border: 1px solid #ddd;">% Победи</th>
          <th style="padding: 10px; border: 1px solid #ddd; background-color: #1e40af;">Точки</th>
        </tr>
      </thead>
      <tbody>
        ${options.rows
          .map(
            (r, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${r.position}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${r.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.played}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #16a34a;">${r.wins}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #dc2626;">${r.losses}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.pointsRatio}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.winRate}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; background-color: ${
              idx === 0
                ? "#fef9c3"
                : idx === 1
                  ? "#f1f5f9"
                  : idx === 2
                    ? "#ffedd5"
                    : "transparent"
            };">${r.totalPoints}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
      Генерирано от Бадминтон клуб Гълъбово Management System • ${new Date().toLocaleDateString("bg-BG")}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // По-високо качество
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

    const filename = `${options.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, "_")}_класиране.pdf`;
    doc.save(filename);
  } finally {
    document.body.removeChild(container);
  }
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
