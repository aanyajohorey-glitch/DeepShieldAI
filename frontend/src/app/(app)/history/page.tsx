import { History } from "lucide-react";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function HistoryPage() {
  return (
    <ComingSoon
      icon={History}
      title="Detection History"
      description="Every video you scan will be logged here with its verdict, confidence score, and timestamp — searchable and exportable for later review."
      capabilities={[
        "Full scan audit trail",
        "Filter by verdict and date",
        "Searchable history table",
        "Exportable scan reports",
      ]}
    />
  );
}
