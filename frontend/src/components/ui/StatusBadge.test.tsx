import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders its label text", () => {
    render(<StatusBadge tone="success">Operational</StatusBadge>);
    expect(screen.getByText("Operational")).toBeInTheDocument();
  });

  it("shows a dot indicator by default", () => {
    const { container } = render(<StatusBadge tone="danger">High Risk</StatusBadge>);
    expect(container.querySelector("span.rounded-full")).not.toBeNull();
  });

  it("omits the dot when dot={false}", () => {
    render(
      <StatusBadge tone="danger" dot={false}>
        DEEPFAKE
      </StatusBadge>
    );
    expect(screen.getByText("DEEPFAKE")).toBeInTheDocument();
  });
});
