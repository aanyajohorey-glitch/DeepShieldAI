import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadReport } from "./report";
import type { DetectionResult } from "@/types";

const sampleResult: DetectionResult = {
  id: 42,
  filename: "sample.mp4",
  prediction: "REAL",
  confidence: 87.3,
  riskLevel: "Low",
  avgFrameScore: 12.7,
  explanation: "Analyzed 5 frames. Average fake-likelihood was 12.7%.",
  framesProcessed: 5,
  processingTime: 1.42,
  modelUsed: "dima806/deepfake_vs_real_image_detection",
  createdAt: "2026-07-28T12:00:00Z",
};

describe("downloadReport", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a blob URL and triggers a click on a download link", () => {
    downloadReport(sampleResult);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("names the file using the result id", () => {
    let capturedAnchor: HTMLAnchorElement | null = null;
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") capturedAnchor = el as HTMLAnchorElement;
      return el;
    });

    downloadReport(sampleResult);

    expect(capturedAnchor?.download).toBe("deepshield-report-42.txt");
  });

  it("includes the explanation text in the generated report content", () => {
    const blobParts: string[] = [];
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, "Blob").mockImplementation(function (this: unknown, parts, options) {
      blobParts.push((parts as string[]).join(""));
      return new OriginalBlob(parts, options);
    } as unknown as typeof Blob);

    downloadReport(sampleResult);

    expect(blobParts[0]).toContain(sampleResult.explanation);
    expect(blobParts[0]).toContain("REAL");
  });
});
