import type { Metadata } from "next";

export const metadata: Metadata = { title: "Survey" };

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
