"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BluetoothButton from "@/components/BluetoothButton";
import DSPDashboard from "@/components/DSPDashboard";

export default function Home() {
  return (
    <div className="relative min-h-screen grid-bg overflow-hidden flex flex-col">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-12 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-slow-spin pointer-events-none" />
      <div className="absolute top-0 -right-12 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-slow-spin pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-slow-spin pointer-events-none" />

      <header className="fixed top-0 w-full z-50 glass border-b border-white/10 px-6 py-4 backdrop-blur-2xl">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">BRROWNTECH</span>
          </div>

          <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 transition-all font-semibold">
            Support
          </Button>
        </nav>
      </header>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-16 md:pt-40 flex flex-col items-center">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-1.5 mb-8 backdrop-blur-sm shadow-lg shadow-blue-500/10 rounded-full animate-pulse">
            Next-Gen Audio DSP Control
          </div>
          
          <h1 className="text-4xl md:text-8xl font-black tracking-tight mb-6 leading-[1.1] md:leading-[0.9] text-white">
            SCULPT YOUR <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-500 to-purple-500 uppercase">Soundscape</span>
          </h1>

          <p className="text-sm md:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
            Professional browser-to-hardware interaction. <br />
            Scan, connect, and process audio with zero latency.
          </p>

          <div className="mt-12 md:mt-16">
            <BluetoothButton />
          </div>
        </div>

        <section className="w-full pb-20">
            <DSPDashboard />
        </section>
      </main>
    </div>
  );
}
