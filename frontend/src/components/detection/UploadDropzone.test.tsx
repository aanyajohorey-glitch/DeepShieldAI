import { describe, expect, it } from "vitest";
import { formatBytes, validateFile } from "./UploadDropzone";
import { DETECTION_MAX_SIZE_BYTES, DETECTION_MAX_SIZE_MB } from "@/lib/detection-constants";

function makeFile(name: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)]);
  return new File([blob], name);
}

describe("validateFile", () => {
  it("accepts a supported extension within the size limit", () => {
    const file = makeFile("clip.mp4", 1024);
    expect(validateFile(file)).toBeNull();
  });

  it("is case-insensitive about extensions", () => {
    const file = makeFile("CLIP.MP4", 1024);
    expect(validateFile(file)).toBeNull();
  });

  it("rejects an unsupported extension", () => {
    const file = makeFile("notes.txt", 1024);
    expect(validateFile(file)).toMatch(/unsupported file format/i);
  });

  it("rejects a file over the max size", () => {
    const file = makeFile("huge.mp4", DETECTION_MAX_SIZE_BYTES + 1);
    expect(validateFile(file)).toMatch(new RegExp(`${DETECTION_MAX_SIZE_MB}MB`));
  });

  it("rejects an empty file", () => {
    const file = makeFile("empty.mp4", 0);
    expect(validateFile(file)).toMatch(/empty/i);
  });
});

describe("formatBytes", () => {
  it("formats sizes under 1MB in KB", () => {
    expect(formatBytes(500 * 1024)).toBe("500 KB");
  });

  it("formats sizes at or above 1MB in MB", () => {
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});
