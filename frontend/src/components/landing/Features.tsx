import { ScanFace, BarChart3, History, Bot, ShieldAlert, ClipboardList } from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  {
    icon: ScanFace,
    title: "Deepfake Video Detection",
    description:
      "Upload and analyze video content using pre-trained AI models trained to spot manipulation artifacts.",
    tone: "cyan",
  },
  {
    icon: BarChart3,
    title: "Threat Analytics Dashboard",
    description:
      "Visualize scan volume, verdicts, and threat trends through a clean, real-time analytics workspace.",
    tone: "purple",
  },
  {
    icon: History,
    title: "Detection History",
    description:
      "Every scan is logged with timestamps and verdicts, giving you a complete, searchable audit trail.",
    tone: "cyan",
  },
  {
    icon: Bot,
    title: "AI Security Assistant",
    description:
      "Ask questions about your scan results and get guidance from an integrated conversational assistant.",
    tone: "purple",
  },
  {
    icon: ShieldAlert,
    title: "Live Threat Level",
    description:
      "A continuously updated risk indicator summarizes how exposed your monitored content currently is.",
    tone: "cyan",
  },
  {
    icon: ClipboardList,
    title: "Feedback & Survey Tools",
    description:
      "Structured feedback loops help refine detection accuracy and the overall analyst experience.",
    tone: "purple",
  },
];

const toneClasses = {
  cyan: "from-cyan-strong/20 to-cyan/5 text-cyan",
  purple: "from-purple-strong/20 to-purple/5 text-purple",
};

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">Platform</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to fight synthetic media
          </h2>
          <p className="mt-4 text-lg text-muted">
            A complete toolkit for detecting, tracking, and understanding deepfake threats.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08}>
              <div className="glass-card group h-full p-6">
                <span
                  className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${toneClasses[feature.tone as "cyan" | "purple"]} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
