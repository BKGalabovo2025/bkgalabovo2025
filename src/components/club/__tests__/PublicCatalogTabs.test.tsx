import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PublicCatalogTabs from "../PublicCatalogTabs";

describe("PublicCatalogTabs", () => {
  it("matches DOM snapshot", () => {
    // This is the FAST alternative to visual tests! 
    // It renders the HTML structure and checks if any classes or elements changed.
    // It takes milliseconds instead of minutes.
    const { container } = render(<PublicCatalogTabs trainings={[]} generalServices={[]} products={[]} />);
    expect(container).toMatchSnapshot();
  });
});
