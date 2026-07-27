import { FolderSearch } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export function RecentScansCard() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Your latest deepfake detection results</CardDescription>
        </div>
      </CardHeader>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
          <FolderSearch className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">No scans yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Scan results will appear here once Detection is available.
          </p>
        </div>
      </div>
    </Card>
  );
}
