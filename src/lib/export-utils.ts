/**
 * Utilities for exporting data from the application into standard formats.
 */

/**
 * Downloads a list of objects as a CSV file.
 * @param data - Array of objects to export.
 * @param filename - Name of the downloaded file.
 */
export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string = "export.csv"
) => {
  if (!data || !data.length) {
    console.warn("No data provided for export.");
    return;
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Construct CSV content
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        let val = obj[header];
        // Handle nulls/undefined
        if (val === null || val === undefined) return "";
        const cellValue = String(val).replace(/"/g, '""');
        // Wrap in quotes if it contains a comma or newline
        if (cellValue.includes(",") || cellValue.includes("\n") || cellValue.includes('"')) {
          return `"${cellValue}"`;
        }
        return cellValue;
      })
      .join(",")
  );

  const csvString = [headers.join(","), ...rows].join("\n");
  
  // Create a blob and download link
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
