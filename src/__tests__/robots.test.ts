import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("robots.txt protection rules", () => {
  const robotsPath = path.resolve(process.cwd(), "public/robots.txt");

  it("съществува в public/robots.txt", () => {
    expect(fs.existsSync(robotsPath)).toBe(true);
  });

  it("блокира тежки ботове и scrapers", () => {
    const content = fs.readFileSync(robotsPath, "utf-8");
    expect(content).toContain("GPTBot");
    expect(content).toContain("ClaudeBot");
    expect(content).toContain("Bytespider");
    expect(content).toContain("AhrefsBot");
    expect(content).toContain("SemrushBot");
  });

  it("блокира търсене на административни маршрути и query strings", () => {
    const content = fs.readFileSync(robotsPath, "utf-8");
    expect(content).toContain("Disallow: /api/");
    expect(content).toContain("Disallow: /dashboard/");
    expect(content).toContain("Disallow: /finances/");
    expect(content).toContain("Disallow: /*?*");
  });
});
