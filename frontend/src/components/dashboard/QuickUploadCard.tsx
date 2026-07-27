"use client";

import { useState } from "react";
import { UploadCloud, FileVideo, Sparkles } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export function QuickUploadCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Quick Upload</CardTitle>
          <CardDescription>Submit a video for deepfake analysis</CardDescription>
        </div>
      </CardHeader>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-cyan/50 hover:bg-surface-hover cursor-pointer"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-strong/20 to-purple-strong/20 text-cyan transition-transform duration-200 group-hover:scale-105">
          <UploadCloud className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Drop a video or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">MP4, MOV, or AVI up to 500MB</p>
        </div>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Detection module launching soon"
        description="Video upload and deepfake analysis will be enabled in the next development phase."
      >
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
            <FileVideo className="size-4" />
          </span>
          <p className="text-sm text-muted">
            This phase focuses on the platform foundation. Detection lands next.
          </p>
        </div>
        <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
          <Sparkles className="size-4" />
          Got it
        </Button>
      </Dialog>
    </Card>
  );
}
