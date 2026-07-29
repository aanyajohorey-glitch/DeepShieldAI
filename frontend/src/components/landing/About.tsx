import { GraduationCap, Layers, Rocket } from "lucide-react";
import { Reveal } from "./Reveal";

const pillars = [
  {
    icon: GraduationCap,
    title: "Academic Foundation",
    description:
      "Developed as an AI & Cybersecurity capstone project, exploring how applied AI can support digital media trust.",
  },
  {
    icon: Layers,
    title: "Production-Style Architecture",
    description:
      "A Next.js and FastAPI stack organized the way real security products are built — modular, typed, and testable.",
  },
  {
    icon: Rocket,
    title: "Phased Delivery",
    description:
      "Built and shipped across five focused phases — from a polished UI foundation to a fully explainable, production-ready AI detection platform.",
  },
];

export function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">About the project</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cybersecurity meets applied AI
          </h2>
          <p className="mt-4 text-lg text-muted">
            DeepShield AI demonstrates how modern web engineering and pre-trained
            AI models can come together to defend against synthetic media threats.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.1}>
              <div className="glass-card h-full p-7 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-strong to-purple-strong">
                  <pillar.icon className="size-6 text-white" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
