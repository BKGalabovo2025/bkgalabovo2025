import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "../middleware";

describe("Edge Middleware (src/middleware.ts)", () => {
  it.each([
    ["root path", "http://localhost:3000/"],
    ["login path", "http://localhost:3000/login"],
    ["quiz path", "http://localhost:3000/quiz/test-token"],
    ["landing schedule path", "http://localhost:3000/club/schedule"],
  ])("should allow public %s without session", (_name, url) => {
    const req = new NextRequest(url);
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it.each([
    ["/dashboard", "%2Fdashboard"],
    ["/members", "%2Fmembers"],
    ["/sales", "%2Fsales"],
  ])(
    "should redirect unauthenticated request for '%s' to '/login'",
    (path, encodedRedirect) => {
      const req = new NextRequest(`http://localhost:3000${path}`);
      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain(`redirect=${encodedRedirect}`);
    }
  );

  it("should allow protected routes when valid session cookie exists", () => {
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: "session=valid-firebase-session-cookie",
      },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
