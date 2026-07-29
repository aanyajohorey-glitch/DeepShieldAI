import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttentionHeatmap } from "./AttentionHeatmap";

describe("AttentionHeatmap", () => {
  it("renders nothing when heatmapUrl is null", () => {
    const { container } = render(<AttentionHeatmap heatmapUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the heatmap image when a URL is provided", () => {
    render(<AttentionHeatmap heatmapUrl="/static/heatmaps/abc123.png" />);
    const img = screen.getByAltText("Attention heatmap overlay") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/static/heatmaps/abc123.png");
  });
});
