"use client";

import React, { useState } from "react";
import { useBluetooth } from "@/lib/bluetooth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AudioLines,
    Bluetooth,
    Cable,
    Disc,
    Equal,
    Layers,
    Lock,
    Radio,
    SlidersHorizontal,
    Speaker,
    Waves,
    Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const INPUT_OPTIONS = [
    { id: 1, label: "Line In", short: "LINE", icon: Cable },
    { id: 2, label: "Bluetooth", short: "BT", icon: Bluetooth },
];

const CHANNELS = [
    { id: 1, label: "Front Left", short: "FL" },
    { id: 2, label: "Front Right", short: "FR" },
    { id: 3, label: "Rear Left", short: "RL" },
    { id: 4, label: "Rear Right", short: "RR" },
    { id: 6, label: "Subwoofer", short: "SUB" },
];

const EQ_DEFAULTS = [
    32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
].map((frequency) => ({
    frequency,
    q: 1.2,
    gain: 0,
}));

const FX_TOGGLES = [
    { id: 0x0D, label: "Vocal Elimination", caption: "Center suppression" },
    { id: 0x0E, label: "Stereo Enhance", caption: "Wider stereo image" },
    { id: 0x0F, label: "3D Sound", caption: "Spatial enhancement" },
];

type EqBandState = {
    frequency: number;
    q: number;
    gain: number;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function formatHz(value: number) {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} kHz`;
    }
    return `${Math.round(value)} Hz`;
}

function formatDb(value: number) {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)} dB`;
}

function formatMs(value: number) {
    return `${Math.round(value)} ms`;
}

const DSPDashboard = () => {
    const {
        isConnected,
        deviceName,
        selectInput,
        setVolume,
        setEQ,
        setEQGlobalEnable,
        setEQGlobalPregain,
        setBassBoost,
        setSubwooferFrequency,
        setSubwooferDelay,
        setPhase,
        setFilterType,
        setFilterFrequency,
        setAutoOffThreshold,
        toggleFeature,
    } = useBluetooth();

    const [activeTab, setActiveTab] = useState("routing");
    const [selectedInput, setSelectedInput] = useState(2);
    const [channelLevels, setChannelLevels] = useState<Record<number, number>>({
        1: 8,
        2: 8,
        3: 8,
        4: 8,
        6: 8,
    });
    const [eqGlobal, setEqGlobal] = useState({
        enable: true,
        pregain: 0,
    });
    const [eqBands, setEqBands] = useState<EqBandState[]>(EQ_DEFAULTS);
    const [filterMode, setFilterModeValue] = useState(0);
    const [filterCutoff, setFilterCutoff] = useState(120);
    const [autoOff, setAutoOff] = useState(30);
    const [subwoofer, setSubwoofer] = useState({
        frequency: 80,
        bassBoost: 0,
        phase: 0,
        delay: 0,
    });

    const [featureStates, setFeatureStates] = useState<Record<number, boolean>>({
        0x0D: false,
        0x0E: false,
        0x0F: false,
    });
    const [channelPhases, setChannelPhases] = useState<Record<number, number>>({
        1: 0, 2: 0, 3: 0, 4: 0, 6: 0
    });

    const isLocked = !isConnected;

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-yellow-500/30">
            {/* STICKY MOBILE HEADER */}
            <div className="sticky top-0 z-40 border-b border-white/5 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black tracking-tighter text-white">BP10 CONSOLE</h1>
                        <div className="flex items-center gap-1.5 ">
                            <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "animate-pulse bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "bg-white/20"}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                {isConnected ? deviceName ?? "Online" : "Scanning..."}
                            </span>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-[0.1em] text-yellow-300">
                        V1.2.0-PRO
                    </Badge>
                </div>
            </div>

            <main className="flex-1 px-4 pb-40 pt-4 md:px-8 md:pt-10">
                <div className="mx-auto w-full max-w-7xl">
                    {/* DESKTOP HEADER - Hidden on Mobile */}
                    <div className="mb-10 hidden md:block">
                        <div className="flex items-center justify-between gap-10">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black tracking-tighter text-white">BP10 <span className="text-white/20">Control Deck</span></h1>
                                <p className="text-yellow-400/60 font-bold uppercase tracking-[0.3em] text-xs">Professional Studio DSP Engine • {isConnected ? deviceName : "Offline"}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <StatusTile icon={Radio} label="Protocol" value="Gatt Bridge" />
                                <StatusTile icon={AudioLines} label="Status" value={isConnected ? "Linked" : "Scanning"} />
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        {/* TAB NAVIGATION: Fixed Bottom on Mobile, Relative on Desktop */}
                        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 border-t border-white/8 bg-[#0a1219]/95 px-1.5 pb-safe pt-2 backdrop-blur-3xl md:relative md:bottom-auto md:mb-10 md:border-none md:bg-transparent md:p-0">
                            <TabsList className="flex h-16 w-full items-stretch gap-0 rounded-[2.5rem] bg-white/4 p-1.5 px-2 md:h-14 md:w-max md:gap-2 md:rounded-3xl md:px-2">
                                <TabChip value="routing" active={activeTab === "routing"} icon={SlidersHorizontal} label="Mixer" />
                                <TabChip value="eq" active={activeTab === "eq"} icon={Equal} label="EQ" />
                                <TabChip value="filters" active={activeTab === "filters"} icon={Layers} label="Cross" />
                                <TabChip value="sub" active={activeTab === "sub"} icon={Speaker} label="Sub" />
                                <TabChip value="fx" active={activeTab === "fx"} icon={Waves} label="FX" />
                            </TabsList>
                        </div>

                        {/* CONTENT SECTIONS */}
                        <div className="space-y-6 md:space-y-10">
                            <TabsContent value="routing" className="mt-0 outline-none">
                                <SectionCard title="Input & Mixer" description="Source selection and channel gain." icon={Radio}>
                                    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {INPUT_OPTIONS.map((input) => (
                                                    <Button
                                                        key={input.id}
                                                        type="button"
                                                        disabled={isLocked}
                                                        variant="ghost"
                                                        onClick={() => { setSelectedInput(input.id); void selectInput(input.id); }}
                                                        className={`h-22 flex-col rounded-2xl border transition-all duration-300 ${selectedInput === input.id ? "border-yellow-400/50 bg-yellow-500/15 text-white shadow-[0_0_20px_rgba(250,204,21,0.15)]" : "border-white/5 bg-white/2 text-white/40 hover:bg-white/5"}`}
                                                    >
                                                        <input.icon className={`mb-2 h-5 w-5 transition-transform ${selectedInput === input.id ? "scale-110 text-yellow-400" : ""}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{input.short}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                            <RangeControl label="Master Volume" value={eqGlobal.pregain} display={formatDb(eqGlobal.pregain)} min={-12} max={4.5} step={0.5} disabled={isLocked} onChange={(v: number[]) => { setEqGlobal(c => ({...c, pregain: v[0]})); void setEQGlobalPregain(v[0]); }} />
                                            <RangeControl label="Silence Threshold" value={autoOff} display={autoOff.toString()} min={10} max={50} step={1} disabled={isLocked} onChange={(v: number[]) => { setAutoOff(v[0]); void setAutoOffThreshold(v[0]); }} />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                            {CHANNELS.map((channel) => (
                                                <div key={channel.id} className="relative">
                                                    <RangeControl 
                                                        className="pr-16" 
                                                        label={channel.label} 
                                                        value={channelLevels[channel.id]} 
                                                        display={channelLevels[channel.id].toString()} 
                                                        min={0} max={16} step={1} 
                                                        disabled={isLocked} 
                                                        onChange={(v: number[]) => { setChannelLevels(c => ({...c, [channel.id]: v[0]})); void setVolume(channel.id, v[0]); }} 
                                                    />
                                                    <button 
                                                        disabled={isLocked}
                                                        onClick={() => {
                                                            const next = channelPhases[channel.id] === 0 ? 1 : 0;
                                                            setChannelPhases(c => ({...c, [channel.id]: next}));
                                                            void setPhase(channel.id, next);
                                                        }}
                                                        className={`absolute right-4 top-[2.5rem] flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-300 ${channelPhases[channel.id] === 1 ? "border-amber-500/50 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-white/5 bg-white/5 text-white/20 hover:bg-white/10"}`}
                                                    >
                                                        <span className="text-base font-black italic">Φ</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="eq" className="mt-0 outline-none">
                                <SectionCard title="Equalizer" description="Touch-optimized 10-band precision control with global gains." icon={Equal}>
                                    <div className="mb-8 grid gap-4 rounded-[2rem] border border-white/8 bg-white/3 p-6 sm:grid-cols-1">
                                        <div className="flex items-center justify-between rounded-3xl border border-white/5 bg-black/40 p-5 shadow-inner">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Master EQ</p>
                                                <p className="text-xs font-medium text-white/30">Process bypass control</p>
                                            </div>
                                            <button 
                                                disabled={isLocked}
                                                onClick={() => { const next = !eqGlobal.enable; setEqGlobal(c => ({...c, enable: next})); void setEQGlobalEnable(next); }}
                                                className={`h-11 w-24 rounded-2xl border font-black tracking-widest transition-all duration-500 ${eqGlobal.enable ? "border-yellow-500/50 bg-yellow-500/15 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.1)]" : "border-white/5 bg-white/5 text-white/15"}`}
                                            >
                                                {eqGlobal.enable ? "ACTIVE" : "BYPASS"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-6 snap-x snap-mandatory">
                                        <div className="flex gap-4 pt-2">
                                            {eqBands.map((band, index) => (
                                                <div key={index} className="flex min-w-[150px] flex-col gap-6 rounded-[2.25rem] border border-white/8 bg-white/2 p-6 transition-all hover:bg-white/4 snap-center">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black text-yellow-400 tracking-tighter">BAND {index + 1}</span>
                                                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/30 tracking-tight">{formatHz(band.frequency)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-5 py-4">
                                                        <Slider orientation="vertical" className="h-48" min={-12} max={12} step={0.5} disabled={isLocked} value={[band.gain]} onValueChange={(v: number[]) => { setEqBands(curr => curr.map((it, i) => i === index ? {...it, gain: v[0]} : it)); void setEQ(index, 4, v[0]); }} />
                                                        <div className="text-2xl font-black text-white tabular-nums">{band.gain > 0 ? "+" : ""}{band.gain.toFixed(1)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="filters" className="mt-0 outline-none">
                                <SectionCard title="Crossover HPF" description="High-pass filter mode and precision cutoff." icon={Layers}>
                                    <div className="grid gap-8">
                                        <div className="flex items-center justify-between rounded-3xl border border-white/5 bg-black/40 p-5 shadow-inner">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">HPF Filter</p>
                                                <p className="text-xs font-medium text-white/30">Crossover high-pass control</p>
                                            </div>
                                            <button 
                                                disabled={isLocked}
                                                onClick={() => { const next = filterMode === 1 ? 0 : 1; setFilterModeValue(next); void setFilterType(next); }}
                                                className={`h-11 w-24 rounded-2xl border font-black tracking-widest transition-all duration-500 ${filterMode === 1 ? "border-yellow-500/50 bg-yellow-500/15 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.1)]" : "border-white/5 bg-white/5 text-white/15"}`}
                                            >
                                                {filterMode === 1 ? "ACTIVE" : "BYPASS"}
                                            </button>
                                        </div>
                                        <RangeControl label="HPF Cutoff Frequency" value={filterCutoff} display={formatHz(filterCutoff)} min={60} max={200} step={1} disabled={isLocked} onChange={(v: number[]) => { setFilterCutoff(v[0]); void setFilterFrequency(v[0]); }} />
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="sub" className="mt-0 outline-none">
                                <SectionCard title="Subwoofer" description="Dedicated low-end tuning and delay sync." icon={Speaker}>
                                    <div className="grid gap-8 lg:grid-cols-2">
                                        <div className="space-y-6">
                                            <RangeControl label="X-Over Frequency" value={subwoofer.frequency} display={formatHz(subwoofer.frequency)} min={20} max={250} step={1} disabled={isLocked} onChange={(v: number[]) => { setSubwoofer(c => ({...c, frequency: v[0]})); void setSubwooferFrequency(v[0]); }} />
                                            <RangeControl label="Bass Dynamic Gain" value={subwoofer.bassBoost} display={formatDb(subwoofer.bassBoost)} min={-12} max={12} step={0.5} disabled={isLocked} onChange={(v: number[]) => { setSubwoofer(c => ({...c, bassBoost: v[0]})); void setBassBoost(v[0]); }} />
                                            <RangeControl label="Phase Delay Compensation" value={subwoofer.delay} display={`${subwoofer.delay} ms`} min={0} max={5} step={1} disabled={isLocked} onChange={(v: number[]) => { setSubwoofer(c => ({...c, delay: v[0]})); void setSubwooferDelay(v[0]); }} />
                                        </div>
                                        <div className="flex flex-col gap-4 rounded-[2.5rem] border border-white/8 bg-white/2 p-8 shadow-inner">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Polarity Phase</p>
                                            <div className="grid grid-cols-2 gap-4 flex-1">
                                                {[0, 1].map((p) => (
                                                    <Button key={p} variant="ghost" disabled={isLocked} onClick={() => { setSubwoofer(c => ({...c, phase: p})); void setPhase(6, p); }} className={`h-full rounded-[2rem] border text-3xl font-black transition-all duration-300 ${subwoofer.phase === p ? "border-yellow-400/50 bg-yellow-500/15 text-white shadow-lg shadow-yellow-500/10" : "border-white/5 bg-white/2 text-white/15"}`}>
                                                        {p === 0 ? "0°" : "180°"}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="fx" className="mt-0 outline-none">
                                <SectionCard title="Soundstage" description="Ambience levels and DSP logic switches." icon={Waves}>
                                    <div className="space-y-4">
                                        {FX_TOGGLES.map((f) => (
                                            <button key={f.id} disabled={isLocked} onClick={() => { const next = !featureStates[f.id]; setFeatureStates(c => ({...c, [f.id]: next})); void toggleFeature(f.id, next); }} className={`flex w-full items-center justify-between rounded-3xl border p-6 transition-all duration-300 ${featureStates[f.id] ? "border-orange-500/40 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.05)]" : "border-white/5 bg-white/2 hover:bg-white/4"} ${isLocked ? "opacity-30" : ""}`}>
                                                <div className="text-left">
                                                    <p className="text-base font-black uppercase tracking-[0.15em] text-white">{f.label}</p>
                                                    <p className="text-[11px] font-medium text-white/30">{f.caption}</p>
                                                </div>
                                                <div className={`h-4 w-4 rounded-full border-2 border-background ring-4 ${featureStates[f.id] ? "bg-orange-500 ring-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "bg-white/10 ring-transparent"}`} />
                                            </button>
                                        ))}
                                    </div>
                                </SectionCard>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </main>
        </div>
    );
};

// --- MOBILE-FIRST HELPERS ---

function TabChip({ value, active, icon: Icon, label }: any) {
    return (
        <TabsTrigger value={value} className={`flex flex-1 flex-col items-center justify-center gap-1 px-1 rounded-3xl transition-all duration-300 md:flex-none md:flex-row md:py-3 md:px-4 ${active ? "bg-yellow-500/20 text-yellow-400 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.2)]" : "text-white/30 hover:text-white/60 hover:bg-white/5"}`}>
            <Icon className={`h-5 w-5 md:h-4 md:w-4 ${active ? "opacity-100" : "opacity-50"}`} />
            <span className="text-[8px] font-black uppercase tracking-wider md:text-xs md:tracking-[0.2em]">{label}</span>
        </TabsTrigger>
    );
}

function SectionCard({ title, description, icon: Icon, children }: any) {
    return (
        <Card className="border-white/8 bg-white/3 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden border-t-white/15">
            <CardHeader className="p-6 pb-2 md:p-10 md:pb-4">
                <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                        <Icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</CardTitle>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-widest text-white/30 md:text-sm">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 md:p-10 md:pt-4">{children}</CardContent>
        </Card>
    );
}

function StatusTile({ icon: Icon, label, value }: any) {
    return (
        <div className="rounded-[1.5rem] border border-white/5 bg-white/2 p-4 ring-1 ring-white/5 min-w-[200px] shadow-lg shadow-black/20">
            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <p className="mt-1.5 text-lg font-black text-white italic tracking-tighter">{value}</p>
        </div>
    );
}

function RangeControl({ label, value, display, min, max, step, disabled, onChange, compact, className }: any) {
    return (
        <div className={`rounded-[2rem] border border-white/5 bg-[#000000]/40 w-full transition-all duration-500 hover:border-white/10 ${compact ? "p-4" : "p-5 md:p-8"} ${className}`}>
            <div className="mb-5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{label}</span>
                <span className="rounded-lg bg-yellow-400/10 px-3 py-1 text-[13px] font-black text-yellow-400 tabular-nums shadow-[0_0_15px_rgba(250,204,21,0.1)]">{display}</span>
            </div>
            <Slider disabled={disabled} min={min} max={max} step={step} value={[clamp(value, min, max)]} onValueChange={onChange} />
        </div>
    );
}

export default DSPDashboard;
