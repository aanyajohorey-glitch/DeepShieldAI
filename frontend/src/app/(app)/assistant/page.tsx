import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function AssistantPage() {
  return (
    <ComingSoon
      icon={Bot}
      title="AI Security Assistant"
      description="A conversational assistant that helps you interpret scan results, understand threat indicators, and navigate DeepShield AI more effectively."
      capabilities={[
        "Natural-language scan explanations",
        "Guided threat investigation",
        "Contextual security tips",
        "Conversation history",
      ]}
    />
  );
}
