import { describe, expect, it } from "vitest";

import { parseDocxXml } from "../lib/docx-parser";

describe("Docx XML Parsing Unit Tests", () => {
  it("should parse paragraphs with formatting and alignment", () => {
    const sampleXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:pStyle w:val="Heading1"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:u w:val="single"/>
              </w:rPr>
              <w:t>Н А Р Е Д Б А</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:r>
              <w:t>Национална верига &quot;Млади таланти&quot;</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const blocks = parseDocxXml(sampleXml);
    expect(blocks).toHaveLength(2);

    const first = blocks[0];
    expect(first.type).toBe("paragraph");
    if (first.type === "paragraph") {
      expect(first.align).toBe("center");
      expect(first.isHeading).toBe(true);
      expect(first.runs[0].text).toBe("Н А Р Е Д Б А");
      expect(first.runs[0].bold).toBe(true);
      expect(first.runs[0].underline).toBe(true);
    }
  });

  it("should parse tables with rows and cells", () => {
    const sampleXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:p><w:r><w:t>Място на провеждане</w:t></w:r></w:p>
              </w:tc>
              <w:tc>
                <w:p><w:r><w:t>гр. София, зала Европа</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>
    `;

    const blocks = parseDocxXml(sampleXml);
    expect(blocks).toHaveLength(1);

    const table = blocks[0];
    expect(table.type).toBe("table");
    if (table.type === "table") {
      expect(table.rows).toHaveLength(1);
      expect(table.rows[0].cells).toHaveLength(2);
      expect(table.rows[0].cells[0].paragraphs[0].runs[0].text).toBe(
        "Място на провеждане"
      );
    }
  });

  it("should return empty array for empty or missing body", () => {
    expect(parseDocxXml("")).toEqual([]);
    expect(parseDocxXml("<w:document></w:document>")).toEqual([]);
  });
});
