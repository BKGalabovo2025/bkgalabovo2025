import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LanguageProvider } from "@/context/language-context";

import Page from "./page";

describe("Home Page", () => {
  it("renders correctly", () => {
    const { container } = render(
      <LanguageProvider>
        <Page />
      </LanguageProvider>
    );
    expect(container).toBeDefined();
  });
});
