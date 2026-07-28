export const DETECTION_ACCEPTED_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv"];

export const DETECTION_ACCEPT_ATTRIBUTE = "video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.mov,.avi,.mkv";

export const DETECTION_MAX_SIZE_MB = 200;

export const DETECTION_MAX_SIZE_BYTES = DETECTION_MAX_SIZE_MB * 1024 * 1024;

export const DETECTION_STAGES = [
  "Uploading video...",
  "Extracting frames...",
  "Running AI inference...",
  "Aggregating frame scores...",
  "Generating report...",
] as const;
