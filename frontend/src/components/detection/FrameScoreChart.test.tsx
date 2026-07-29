import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FrameScoreChart } from "./FrameScoreChart";
import { makeDetectionResult } from "@/test-utils/fixtures";

describe("FrameScoreChart", () => {
  it("renders the chart title and description", () => {
    render(<FrameScoreChart result={makeDetectionResult()} />);
    expect(screen.getByText("Per-Frame Analysis")).toBeInTheDocument();
    expect(screen.getByText(/fake-likelihood score for each sampled frame/i)).toBeInTheDocument();
  });

  it("explains the decision threshold line", () => {
    render(<FrameScoreChart result={makeDetectionResult()} />);
    expect(screen.getByText(/50% decision threshold/i)).toBeInTheDocument();
  });
});
