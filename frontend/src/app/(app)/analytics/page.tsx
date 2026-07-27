import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Threat Analytics"
      description="Visualize detection trends, verdict distributions, and threat-level patterns across your entire scan history with interactive charts."
      capabilities={[
        "Scan volume trend charts",
        "Authentic vs. deepfake breakdown",
        "Threat level over time",
        "Exportable analytics reports",
      ]}
    />
  );
}
