export interface DocxRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  isBreak?: boolean;
}

export interface DocxParagraph {
  type: "paragraph";
  align?: "left" | "center" | "right" | "justify";
  isHeading?: boolean;
  headingLevel?: number;
  runs: DocxRun[];
}

export interface DocxTableCell {
  paragraphs: DocxParagraph[];
}

export interface DocxTableRow {
  cells: DocxTableCell[];
}

export interface DocxTable {
  type: "table";
  rows: DocxTableRow[];
}

export type DocxBlock = DocxParagraph | DocxTable;

function parseParagraphElement(pNode: Element): DocxParagraph {
  let align: "left" | "center" | "right" | "justify" = "left";
  let isHeading = false;
  let headingLevel = 1;

  // Check pPr
  const pPr = Array.from(pNode.children).find(
    (c) => c.localName === "pPr" || c.nodeName.endsWith(":pPr")
  );

  if (pPr) {
    for (const child of Array.from(pPr.children)) {
      const tag = child.localName || child.nodeName.split(":").pop();
      if (tag === "jc") {
        const val = child.getAttribute("w:val") || child.getAttribute("val");
        if (val === "center") align = "center";
        else if (val === "right") align = "right";
        else if (val === "both" || val === "distribute") align = "justify";
      } else if (tag === "pStyle") {
        const val = (
          child.getAttribute("w:val") ||
          child.getAttribute("val") ||
          ""
        ).toLowerCase();
        if (val.includes("heading") || val.includes("title")) {
          isHeading = true;
          const match = val.match(/\d+/);
          headingLevel = match
            ? Math.min(Math.max(parseInt(match[0], 10), 1), 6)
            : 1;
        }
      }
    }
  }

  const runs: DocxRun[] = [];

  for (const child of Array.from(pNode.children)) {
    const tag = child.localName || child.nodeName.split(":").pop();
    if (tag === "r") {
      let bold = false;
      let italic = false;
      let underline = false;
      let strike = false;
      let color: string | undefined;

      const rPr = Array.from(child.children).find(
        (c) => c.localName === "rPr" || c.nodeName.endsWith(":rPr")
      );

      if (rPr) {
        for (const rChild of Array.from(rPr.children)) {
          const rTag = rChild.localName || rChild.nodeName.split(":").pop();
          if (rTag === "b") {
            const val =
              rChild.getAttribute("w:val") || rChild.getAttribute("val");
            bold = val !== "0" && val !== "false";
          } else if (rTag === "i") {
            const val =
              rChild.getAttribute("w:val") || rChild.getAttribute("val");
            italic = val !== "0" && val !== "false";
          } else if (rTag === "u") {
            const val =
              rChild.getAttribute("w:val") || rChild.getAttribute("val");
            underline = val !== "none";
          } else if (rTag === "strike") {
            strike = true;
          } else if (rTag === "color") {
            const val =
              rChild.getAttribute("w:val") || rChild.getAttribute("val");
            if (val && val !== "auto") {
              color = `#${val}`;
            }
          }
        }
      }

      for (const textOrBreak of Array.from(child.children)) {
        const tbTag =
          textOrBreak.localName || textOrBreak.nodeName.split(":").pop();
        if (tbTag === "t") {
          const text = textOrBreak.textContent || "";
          if (text) {
            runs.push({
              text,
              bold,
              italic,
              underline,
              strike,
              color,
            });
          }
        } else if (tbTag === "br") {
          runs.push({
            text: "\n",
            isBreak: true,
          });
        } else if (tbTag === "tab") {
          runs.push({
            text: "    ",
          });
        }
      }
    }
  }

  return {
    type: "paragraph",
    align,
    isHeading,
    headingLevel,
    runs,
  };
}

function parseTableElement(tblNode: Element): DocxTable {
  const rows: DocxTableRow[] = [];

  for (const child of Array.from(tblNode.children)) {
    const tag = child.localName || child.nodeName.split(":").pop();
    if (tag === "tr") {
      const cells: DocxTableCell[] = [];
      for (const trChild of Array.from(child.children)) {
        const cellTag = trChild.localName || trChild.nodeName.split(":").pop();
        if (cellTag === "tc") {
          const paragraphs: DocxParagraph[] = [];
          for (const tcChild of Array.from(trChild.children)) {
            const pTag = tcChild.localName || tcChild.nodeName.split(":").pop();
            if (pTag === "p") {
              paragraphs.push(parseParagraphElement(tcChild));
            }
          }
          cells.push({ paragraphs });
        }
      }
      if (cells.length > 0) {
        rows.push({ cells });
      }
    }
  }

  return {
    type: "table",
    rows,
  };
}

/**
 * Parses raw XML string from word/document.xml into structured DocxBlock elements.
 */
export function parseDocxXml(xmlString: string): DocxBlock[] {
  if (!xmlString) return [];

  const ParserClass = typeof window !== "undefined" ? window.DOMParser : null;
  if (!ParserClass) return [];

  const parser = new ParserClass();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  // Find w:body
  const body =
    xmlDoc.getElementsByTagName("w:body")[0] ||
    xmlDoc.getElementsByTagName("body")[0];

  if (!body) return [];

  const blocks: DocxBlock[] = [];

  for (const child of Array.from(body.children)) {
    const tag = child.localName || child.nodeName.split(":").pop();
    if (tag === "p") {
      const p = parseParagraphElement(child);
      blocks.push(p);
    } else if (tag === "tbl") {
      const tbl = parseTableElement(child);
      blocks.push(tbl);
    }
  }

  return blocks;
}

/**
 * Loads a .docx file from arrayBuffer using JSZip, extracts word/document.xml,
 * and parses it into structured blocks.
 */
export async function loadDocxFromBuffer(
  buffer: ArrayBuffer
): Promise<DocxBlock[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);

  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    throw new Error("Файлът не е валиден Word (.docx) документ.");
  }

  const xmlString = await docFile.async("string");
  return parseDocxXml(xmlString);
}
