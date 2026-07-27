import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-9",
};

export function Spinner({ className, size = "md", label }: SpinnerProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-cyan", className)}>
      <Loader2 className={cn("animate-spin", sizeMap[size])} />
      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  );
}

export function FullScreenSpinner({ label = "Loading DeepShield AI..." }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
