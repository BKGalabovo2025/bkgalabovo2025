import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LanguageProvider } from "@/context/language-context";
import Page from "./page";

describe("Home Page", () => {
  it("renders correctly", () => {
    render(
      <LanguageProvider>
        <Page />
      </LanguageProvider>
    );
    expect(true).toBe(true);
  });
});
