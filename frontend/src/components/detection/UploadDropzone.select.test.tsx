import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDropzone } from "./UploadDropzone";

describe("UploadDropzone file selection", () => {
  it("calls onFileSelected when a valid video is chosen via the file input", async () => {
    const onFileSelected = vi.fn();
    const { container } = render(<UploadDropzone onFileSelected={onFileSelected} />);

    const file = new File([new Uint8Array(1024)], "clip.mp4", { type: "video/mp4" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(onFileSelected).toHaveBeenCalledOnce();
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("does not call onFileSelected and shows an error for an invalid extension", async () => {
    // Real browsers still fire a change event for a file that doesn't match
    // the input's `accept` attribute (e.g. via drag-and-drop) — the app is
    // responsible for its own validation. userEvent.upload() enforces
    // `accept` itself, so we simulate the change event directly here to
    // exercise that same real-world path.
    const onFileSelected = vi.fn();
    const { container } = render(<UploadDropzone onFileSelected={onFileSelected} />);

    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(await screen.findByText(/unsupported file format/i)).toBeInTheDocument();
  });
});
