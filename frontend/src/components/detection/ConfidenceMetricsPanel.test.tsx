import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceMetricsPanel } from "./ConfidenceMetricsPanel";
import { makeDetectionResult } from "@/test-utils/fixtures";

describe("ConfidenceMetricsPanel", () => {
  it("renders certainty and consistency percentages from the result", () => {
    render(<ConfidenceMetricsPanel result={makeDetectionResult({ modelCertainty: 74.6, temporalConsistency: 92.4 })} />);
    expect(screen.getByText("74.6%")).toBeInTheDocument();
    expect(screen.getByText("92.4%")).toBeInTheDocument();
  });

  it("renders both metric labels", () => {
    render(<ConfidenceMetricsPanel result={makeDetectionResult()} />);
    expect(screen.getByText("Model Certainty")).toBeInTheDocument();
    expect(screen.getByText("Temporal Consistency")).toBeInTheDocument();
  });
});
