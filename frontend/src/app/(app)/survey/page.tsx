import { ClipboardList } from "lucide-react";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function SurveyPage() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="Survey & Feedback"
      description="Structured surveys will help us gather feedback on detection accuracy and the overall analyst experience to guide future improvements."
      capabilities={[
        "In-app feedback surveys",
        "Detection accuracy ratings",
        "Feature request submissions",
        "Response history",
      ]}
    />
  );
}
