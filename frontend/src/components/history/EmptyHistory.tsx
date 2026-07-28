import Link from "next/link";
import { ScanFace, FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyHistory() {
  return (
    <div className="glass-card flex flex-col items-center gap-4 px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-surface text-muted-foreground">
        <FolderSearch className="size-7" />
      </span>
      <div>
        <p className="text-base font-medium text-foreground">No scans yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Run your first deepfake detection to see it appear here.
        </p>
      </div>
      <Link href="/detection">
        <Button>
          <ScanFace className="size-4" />
          Analyze a Video
        </Button>
      </Link>
    </div>
  );
}
