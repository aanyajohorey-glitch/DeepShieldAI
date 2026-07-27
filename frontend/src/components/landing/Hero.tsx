"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Cpu, Lock, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const trustPoints = [
  { icon: Cpu, label: "Pre-Trained AI Models" },
  { icon: Activity, label: "Real-Time Analysis" },
  { icon: Lock, label: "Enterprise-Grade Security" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-cyan/20 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-0 h-[420px] w-[520px] rounded-full bg-purple/20 blur-[140px]"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StatusBadge tone="cyan" pulse className="mb-6">
              <Sparkles className="mr-1 size-3" />
              AI &amp; Cybersecurity Capstone Project
            </StatusBadge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Detect deepfake videos{" "}
            <span className="gradient-text">before they deceive.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
          >
            DeepShield AI is a modern cybersecurity platform that uses pre-trained
            AI models to identify manipulated video content — giving analysts a
            clear, real-time view of authenticity and threat level.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <PlayCircle className="size-4" />
                View Dashboard
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            {trustPoints.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted">
                <Icon className="size-4 text-cyan" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="glass-card relative mx-auto max-w-md overflow-hidden p-6">
            <div className="relative mb-5 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-background-elevated">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
              <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-cyan/25 via-cyan/5 to-transparent animate-scan" />
              <Cpu className="relative size-12 text-cyan/70" strokeWidth={1.5} />
              <StatusBadge tone="cyan" pulse className="absolute left-3 top-3">
                Analyzing
              </StatusBadge>
            </div>

            <div className="space-y-4">
              <ProgressBar value={94} tone="cyan" label="Authenticity confidence" showValue />
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-sm text-muted">Verdict</span>
                <StatusBadge tone="success">Authentic</StatusBadge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-sm text-muted">Threat level</span>
                <StatusBadge tone="cyan">Low</StatusBadge>
              </div>
            </div>
          </div>

          <div className="glass-card absolute -bottom-6 -left-8 hidden w-48 p-4 sm:block">
            <p className="text-xs text-muted">AI Engine Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-sm font-medium text-foreground">Operational</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
