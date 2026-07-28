import { describe, expect, it } from "vitest";
import { cn, formatDate, formatRelativeTime, getInitials } from "./utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("text-sm", false, undefined, null, "text-foreground")).toBe("text-sm text-foreground");
  });
});

describe("formatDate", () => {
  it("formats an ISO string as a short human-readable date", () => {
    expect(formatDate("2026-07-28T12:00:00Z")).toBe("Jul 28, 2026");
  });

  it("accepts a Date object directly", () => {
    expect(formatDate(new Date("2026-01-01T00:00:00Z"))).toBe("Jan 1, 2026");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for timestamps within the last minute", () => {
    expect(formatRelativeTime(new Date())).toBe("just now");
  });

  it("returns minutes-ago for timestamps under an hour old", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
  });

  it("returns hours-ago for timestamps under a day old", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("falls back to a formatted date for timestamps a week or older", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(eightDaysAgo)).toBe(formatDate(eightDaysAgo));
  });
});

describe("getInitials", () => {
  it("returns two letters for a single-word name", () => {
    expect(getInitials("Ava")).toBe("AV");
  });

  it("returns first+last initials for multi-word names", () => {
    expect(getInitials("Ava Chen")).toBe("AC");
  });

  it("uses first and last for names with a middle name", () => {
    expect(getInitials("Ava Marie Chen")).toBe("AC");
  });

  it("trims surrounding whitespace", () => {
    expect(getInitials("  Ava Chen  ")).toBe("AC");
  });
});
