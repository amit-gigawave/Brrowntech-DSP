"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bluetooth, SlidersHorizontal, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import BluetoothButton from "@/components/BluetoothButton";
import DSPDashboard from "@/components/DSPDashboard";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(47,142,255,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(0,204,183,0.16),transparent_28%),linear-gradient(180deg,#071019_0%,#08131d_45%,#05080d_100%)]">
      <div className="pointer-events-none flex absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -left-16 top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-500/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050a0f]/80 px-4 py-3 backdrop-blur-3xl md:px-8 md:py-5">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-cyan-400/5 blur-lg" />
              <Waves className="relative h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/70 md:text-xs">Brrowntech</p>
              <p className="text-lg font-black tracking-tighter text-white md:text-2xl">BP10 <span className="text-white/40 font-medium tracking-normal">DSP</span></p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 mr-8">
            {["Overview", "Interface", "Specs", "Support"].map((item) => (
              <a key={item} href="#" className="text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-cyan-400">{item}</a>
            ))}
          </div>

          <Button variant="outline" className="h-10 rounded-full border-white/10 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 md:h-11">
            Sign In
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-safe pt-6 md:gap-10 md:px-8 md:pt-14">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center rounded-[2.5rem] border border-white/10 bg-white/4 p-6 shadow-[0_32px_100px_-20px_rgba(0,0,0,0.5)] md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Mobile Control Protocol
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[0.9] tracking-tight text-white sm:text-5xl md:mt-8 md:text-7xl lg:text-8xl">
              Precision audio
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent italic">
                reimagined
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/50 md:mt-8 md:text-lg md:leading-loose">
              Experience total control over your BP10 sound engine with a touch-first dashboard designed for professional acoustic tuning on the go.
            </p>

            <div className="mt-8 grid gap-4 md:mt-10 sm:grid-cols-3">
              <QuickStat icon={Bluetooth} label="Connectivity" value="Ultra Low Latency" />
              <QuickStat icon={SlidersHorizontal} label="Processing" value="32-bit Floating" />
              <QuickStat icon={Waves} label="Acoustics" value="Zero Distortion" />
            </div>
          </div>

          {/* Bluetooth Connection Module */}
          <div className="order-first lg:order-last flex flex-col items-center justify-center rounded-[2.5rem] border border-cyan-500/20 bg-[linear-gradient(225deg,rgba(0,180,216,0.08),rgba(0,0,0,0.1))] p-6 shadow-[0_32px_100px_-20px_rgba(0,0,0,0.6)] md:p-10">
            <div className="relative mb-8 flex h-24 w-24 items-center justify-center md:h-32 md:w-32">
              <div className="absolute inset-0 animate-slow-spin rounded-full border-2 border-dashed border-cyan-500/20" />
              <div className="absolute inset-4 animate-reverse-spin rounded-full border border-white/5" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/20 text-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.2)] md:h-20 md:w-20">
                <Bluetooth className="h-8 w-8 md:h-10 md:w-10" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400">Step 1: Link</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">Secure Discovery</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/40">
                Using native Web Bluetooth stack for direct hardware bridge. No driver installation required.
              </p>
            </div>

            <div suppressHydrationWarning className="mt-8 w-full">
              <BluetoothButton />
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="mb-3 px-1 md:mb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/35">Control Surface</p>
          </div>
          <DSPDashboard />
        </section>
      </main>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 md:text-[11px] md:tracking-[0.22em]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-white md:text-sm">{value}</p>
    </div>
  );
}
