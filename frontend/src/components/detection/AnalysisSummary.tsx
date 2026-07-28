import { Sparkles } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DetectionResult } from "@/types";

export function AnalysisSummary({ result }: { result: DetectionResult }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-cyan" />
            Analysis Summary
          </CardTitle>
          <CardDescription>How DeepShield AI reached this verdict</CardDescription>
        </div>
      </CardHeader>
      <p className="text-sm leading-relaxed text-muted">{result.explanation}</p>
    </Card>
  );
}
