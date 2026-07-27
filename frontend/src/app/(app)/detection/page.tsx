import { ScanFace } from "lucide-react";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function DetectionPage() {
  return (
    <ComingSoon
      icon={ScanFace}
      title="Deepfake Detection"
      description="Upload video files and run them through DeepShield AI's pre-trained detection models to receive an authenticity verdict and confidence score."
      capabilities={[
        "Drag-and-drop video upload",
        "Real-time analysis progress",
        "Authenticity confidence scoring",
        "Frame-level anomaly highlights",
      ]}
    />
  );
}
