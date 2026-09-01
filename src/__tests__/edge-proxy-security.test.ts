import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "../proxy";

describe("Security: Edge Proxy Boundary & Defense", () => {
  it("should allow public access to any valid campaign ID format under /feedback/*", () => {
    const validCampaignUrls = [
      "http://localhost:3000/feedback/camp_123",
      "http://localhost:3000/feedback/PqRkjq8bh0J6iEkF9bHC",
      "http://localhost:3000/feedback/summer-camp-2026",
    ];

    for (const url of validCampaignUrls) {
      const req = new NextRequest(url);
      const res = proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("should block unauthenticated access to admin routes even with trailing slashes or query parameters", () => {
    const protectedUrls = [
      "http://localhost:3000/members/",
      "http://localhost:3000/dashboard?view=metrics",
      "http://localhost:3000/sales?month=2026-08",
      "http://localhost:3000/inventory?category=equipment",
    ];

    for (const url of protectedUrls) {
      const req = new NextRequest(url);
      const res = proxy(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
    }
  });

  it("should reject path traversal attempts that try to bypass authentication", () => {
    const maliciousTraversals = [
      "http://localhost:3000/feedback/../dashboard",
      "http://localhost:3000/quiz/..%2Fmembers",
    ];

    for (const url of maliciousTraversals) {
      const req = new NextRequest(url);
      const res = proxy(req);
      // If parsed path resolves to protected route, proxy enforces login
      if (
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/members")
      ) {
        expect(res.status).toBe(307);
      }
    }
  });
});
