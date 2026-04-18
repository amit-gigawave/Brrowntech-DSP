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

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07111ade]/80 px-4 py-3 backdrop-blur-2xl md:px-6 md:py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-100 shadow-[0_0_30px_rgba(84,211,255,0.18)]">
              <Waves className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/80 md:text-xs md:tracking-[0.28em]">Brrowntech</p>
              <p className="text-base font-black tracking-tight text-white md:text-lg">BP10 DSP</p>
            </div>
          </div>

          <Button variant="ghost" suppressHydrationWarning className="h-9 rounded-full px-3 text-xs text-white/60 hover:bg-white/5 hover:text-white md:h-10 md:px-4 md:text-sm">
            Support
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-safe pt-4 md:gap-8 md:px-6 md:pb-20 md:pt-10">
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">

          {/* Bluetooth Connection Module - Shifted to TOP on mobile via order-first */}
          <div className="order-first lg:order-last rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] md:rounded-[2rem] md:p-8">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-400">Step 1: Link Device</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white md:mt-3 md:text-2xl">Connect and tune from your phone</h2>
                <p className="mt-2 text-xs leading-5 text-white/55 md:text-sm md:leading-7">
                  Chrome on Android allows native Web Bluetooth connectivity.
                </p>
              </div>

              <div suppressHydrationWarning className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4 md:rounded-[1.75rem] md:p-5 flex justify-center">
                <BluetoothButton />
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/8 bg-white/5 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.26)] md:rounded-[2rem] md:p-8">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 md:px-4 md:tracking-[0.28em]">
              Mobile DSP Control
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[0.95] tracking-tight text-white sm:text-4xl md:mt-5 md:text-6xl">
              Faster access to every
              <span className="block bg-[linear-gradient(90deg,#79e1ff_0%,#54b7ff_45%,#71ffc8_100%)] bg-clip-text text-transparent">
                BP10 tuning control
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 md:mt-5 md:text-base md:leading-7">
              Built for on-phone operation with larger tap targets, compact control groups, and a full DSP feature set.
            </p>

            <div className="mt-5 grid gap-3 md:mt-6 sm:grid-cols-3">
              <QuickStat icon={Bluetooth} label="BLE pairing" value="One-tap connect" />
              <QuickStat icon={SlidersHorizontal} label="Mixer + EQ" value="Touch-first controls" />
              <QuickStat icon={Waves} label="FX + Filters" value="All in one deck" />
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
