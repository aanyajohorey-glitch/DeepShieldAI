export const DETECTION_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv"];
export const DETECTION_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const DETECTION_ACCEPTED_EXTENSIONS = [
  ...DETECTION_VIDEO_EXTENSIONS,
  ...DETECTION_IMAGE_EXTENSIONS,
];

export const DETECTION_ACCEPT_ATTRIBUTE =
  "video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,image/jpeg,image/png,image/webp," +
  [...DETECTION_VIDEO_EXTENSIONS, ...DETECTION_IMAGE_EXTENSIONS].join(",");

export const DETECTION_MAX_SIZE_MB = 200;

export const DETECTION_MAX_SIZE_BYTES = DETECTION_MAX_SIZE_MB * 1024 * 1024;

export const DETECTION_STAGES = [
  "Uploading file...",
  "Analyzing content...",
  "Running AI inference...",
  "Aggregating results...",
  "Generating report...",
] as const;

export function isImageExtension(extension: string): boolean {
  return DETECTION_IMAGE_EXTENSIONS.includes(extension.toLowerCase());
}
