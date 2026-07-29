import { Eye } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { API_ORIGIN } from "@/lib/constants";

export function AttentionHeatmap({ heatmapUrl }: { heatmapUrl: string | null }) {
  if (!heatmapUrl) return null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-4 text-cyan" />
            Attention Visualization
          </CardTitle>
          <CardDescription>Where the AI model focused most on its most-suspicious sampled frame</CardDescription>
        </div>
      </CardHeader>
      <div className="overflow-hidden rounded-xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element -- backend-generated image at a dynamic origin */}
        <img src={`${API_ORIGIN}${heatmapUrl}`} alt="Attention heatmap overlay" className="w-full" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Generated via attention rollout on the model&apos;s Vision Transformer — warmer colors mark regions that
        most influenced the classification decision.
      </p>
    </Card>
  );
}
