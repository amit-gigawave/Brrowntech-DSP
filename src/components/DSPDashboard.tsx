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
    { id: 3, label: "Optical", short: "OPT", icon: Zap },
    { id: 4, label: "Coaxial", short: "COAX", icon: Disc },
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

const FILTER_MODES = [
    { id: 0, label: "LPF" },
    { id: 1, label: "HPF" },
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
        setMasterVolume,
        setEQ,
        setBassBoost,
        setSubwooferFrequency,
        setSubwooferDelay,
        setPhase,
        setFilterType,
        setFilterFrequency,
        setAutoOffThreshold,
        setReverb,
        setEcho,
        toggleFeature,
    } = useBluetooth();

    const [activeTab, setActiveTab] = useState("routing");
    const [selectedInput, setSelectedInput] = useState(2);
    const [masterVolumeValue, setMasterVolumeValue] = useState(8);
    const [channelLevels, setChannelLevels] = useState<Record<number, number>>({
        1: 8,
        2: 8,
        3: 8,
        4: 8,
        6: 8,
    });
    const [eqBands, setEqBands] = useState<EqBandState[]>(EQ_DEFAULTS);
    const [filterMode, setFilterModeValue] = useState(0);
    const [filterCutoff, setFilterCutoff] = useState(120);
    const [autoOff, setAutoOff] = useState(12);
    const [subwoofer, setSubwoofer] = useState({
        frequency: 80,
        bassBoost: 0,
        phase: 0,
        delay: 0,
    });
    const [reverb, setReverbState] = useState({
        room: 45,
        mix: 25,
    });
    const [echo, setEchoState] = useState({
        delay: 140,
        mix: 22,
    });
    const [featureStates, setFeatureStates] = useState<Record<number, boolean>>({
        0x0D: false,
        0x0E: false,
        0x0F: false,
    });

    const isLocked = !isConnected;

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-cyan-500/30">
            {/* STICKY MOBILE HEADER */}
            <div className="sticky top-0 z-40 border-b border-white/5 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black tracking-tighter text-white">BP10 CONSOLE</h1>
                        <div className="flex items-center gap-1.5 ">
                            <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/20"}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                {isConnected ? deviceName ?? "Online" : "Scanning..."}
                            </span>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-[0.1em] text-cyan-300">
                        V1.2.0-PRO
                    </Badge>
                </div>
            </div>

            <main className="flex-1 px-4 pb-32 pt-4 md:px-8 md:pt-8">
                <div className="mx-auto w-full max-w-7xl">
                    {/* DESKTOP HEADER - Hidden on Mobile */}
                    <div className="mb-8 hidden md:block">
                        <div className="flex items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter text-white">BP10 Control Deck</h1>
                                <p className="text-white/40 font-medium">Professional DSP Engine • {isConnected ? deviceName : "Awaiting Connection"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusTile icon={Radio} label="Protocol" value="Web Bluetooth" />
                                <StatusTile icon={AudioLines} label="Link State" value={isConnected ? "GATT Active" : "Searching"} />
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        {/* TAB NAVIGATION: Responsive Positioning */}
                        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe border-t border-white/5 bg-background/90 px-3 pt-3 backdrop-blur-2xl md:relative md:bottom-auto md:mb-8 md:border-none md:bg-transparent md:p-0 md:pb-0">
                            <TabsList className="grid h-16 w-full grid-cols-5 gap-1 rounded-2xl bg-white/4 p-1 md:h-auto md:gap-2 md:rounded-3xl md:bg-white/5">
                                <TabChip value="routing" active={activeTab === "routing"} icon={SlidersHorizontal} label="Mixer" />
                                <TabChip value="eq" active={activeTab === "eq"} icon={Equal} label="EQ" />
                                <TabChip value="filters" active={activeTab === "filters"} icon={Layers} label="Cross" />
                                <TabChip value="sub" active={activeTab === "sub"} icon={Speaker} label="Sub" />
                                <TabChip value="fx" active={activeTab === "fx"} icon={Waves} label="FX" />
                            </TabsList>
                        </div>

                        {/* CONTENT SECTIONS */}
                        <div className="space-y-6">
                            <TabsContent value="routing" className="mt-0 outline-none">
                                <SectionCard title="Input & Levels" description="Source selection, master gain, and threshold." icon={Radio}>
                                    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                {INPUT_OPTIONS.map((input) => (
                                                    <Button
                                                        key={input.id}
                                                        type="button"
                                                        disabled={isLocked}
                                                        variant="ghost"
                                                        onClick={() => { setSelectedInput(input.id); void selectInput(input.id); }}
                                                        className={`h-24 flex-col rounded-2xl border transition-all ${selectedInput === input.id ? "border-cyan-400/50 bg-cyan-500/15 text-white shadow-lg shadow-cyan-500/10" : "border-white/5 bg-white/2 text-white/40 hover:bg-white/5"}`}
                                                    >
                                                        <input.icon className={`mb-2 h-5 w-5 ${selectedInput === input.id ? "text-cyan-400" : ""}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{input.short}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                            <RangeControl label="Master Volume" value={masterVolumeValue} display={masterVolumeValue.toString()} min={0} max={16} step={1} disabled={isLocked} onChange={(v: number[]) => { setMasterVolumeValue(v[0]); void setMasterVolume(v[0]); }} />
                                            <RangeControl label="Silence Threshold" value={autoOff} display={`${autoOff}%`} min={0} max={100} step={1} disabled={isLocked} onChange={(v: number[]) => { setAutoOff(v[0]); void setAutoOffThreshold(v[0]); }} />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                            {CHANNELS.map((channel) => (
                                                <RangeControl key={channel.id} label={channel.label} value={channelLevels[channel.id]} display={channelLevels[channel.id].toString()} min={0} max={16} step={1} disabled={isLocked} onChange={(v: number[]) => { setChannelLevels(c => ({...c, [channel.id]: v[0]})); void setVolume(channel.id, v[0]); }} />
                                            ))}
                                        </div>
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="eq" className="mt-0 outline-none">
                                <SectionCard title="Equalizer" description="Touch-optimized 10-band precision control." icon={Equal}>
                                    <div className="scrollbar-none -mx-3 overflow-x-auto px-3 pb-4 snap-x snap-mandatory">
                                        <div className="flex gap-3 pt-2">
                                            {eqBands.map((band, index) => (
                                                <div key={index} className="flex min-w-[140px] flex-col gap-6 rounded-3xl border border-white/8 bg-white/3 p-5 transition-all hover:border-white/20 snap-center">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-cyan-400">B{index + 1}</span>
                                                        <span className="text-[10px] font-black text-white/40">{formatHz(band.frequency)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-4 py-2">
                                                        <Slider orientation="vertical" className="h-48" min={-12} max={12} step={0.5} disabled={isLocked} value={[band.gain]} onValueChange={(v: number[]) => { setEqBands(curr => curr.map((it, i) => i === index ? {...it, gain: v[0]} : it)); void setEQ(index, 4, v[0]); }} />
                                                        <div className="text-xl font-black text-white">{band.gain > 0 ? "+" : ""}{band.gain.toFixed(1)}</div>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <RangeControl compact label="F" value={band.frequency} display={formatHz(band.frequency)} min={20} max={16000} step={1} disabled={isLocked} onChange={(v: number[]) => { setEqBands(curr => curr.map((it, i) => i === index ? {...it, frequency: v[0]} : it)); void setEQ(index, 0, v[0]); }} />
                                                        <RangeControl compact label="Q" value={band.q} display={band.q.toFixed(1)} min={0.1} max={10} step={0.1} disabled={isLocked} onChange={(v: number[]) => { setEqBands(curr => curr.map((it, i) => i === index ? {...it, q: v[0]} : it)); void setEQ(index, 3, v[0]); }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="filters" className="mt-0 outline-none">
                                <SectionCard title="Crossovers" description="HPF/LPF filter mode and cutoff control." icon={Layers}>
                                    <div className="grid gap-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {FILTER_MODES.map((mode) => (
                                                <Button key={mode.id} variant="ghost" disabled={isLocked} onClick={() => { setFilterModeValue(mode.id); void setFilterType(mode.id); }} className={`h-20 rounded-2xl border text-sm font-black uppercase tracking-[0.2em] ${filterMode === mode.id ? "border-amber-400/50 bg-amber-500/15 text-white shadow-lg shadow-amber-500/10" : "border-white/8 bg-white/2 text-white/40 hover:bg-white/5"}`}>
                                                    {mode.label}
                                                </Button>
                                            ))}
                                        </div>
                                        <RangeControl label="Cutoff Frequency" value={filterCutoff} display={formatHz(filterCutoff)} min={20} max={20000} step={1} disabled={isLocked} onChange={(v: number[]) => { setFilterCutoff(v[0]); void setFilterFrequency(v[0]); }} />
                                    </div>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="sub" className="mt-0 outline-none">
                                <SectionCard title="Subwoofer" description="Dedicated low-end tuning and delay sync." icon={Speaker}>
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="space-y-4">
                                            <RangeControl label="LPF Crossover" value={subwoofer.frequency} display={formatHz(subwoofer.frequency)} min={20} max={200} step={1} disabled={isLocked} onChange={(v: number[]) => { setSubwoofer(c => ({...c, frequency: v[0]})); void setSubwooferFrequency(v[0]); }} />
                                            <RangeControl label="Bass Level" value={subwoofer.bassBoost} display={formatDb(subwoofer.bassBoost)} min={-12} max={12} step={0.5} disabled={isLocked} onChange={(v: number[]) => { setSubwoofer(c => ({...c, bassBoost: v[0]})); void setBassBoost(v[0]); }} />
                                            <RangeControl label="Latency Sync" value={subwoofer.delay} display={formatMs(subwoofer.delay)} min={0} max={250} step={1} disabled={isLocked} onChange={(v: number[]) => { setSubwoofer(c => ({...c, delay: v[0]})); void setSubwooferDelay(v[0]); }} />
                                        </div>
                                        <div className="flex flex-col gap-3 rounded-3xl border border-white/8 bg-white/3 p-6">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Phase Shift</p>
                                            <div className="grid grid-cols-2 gap-3 flex-1">
                                                {[0, 1].map((p) => (
                                                    <Button key={p} variant="ghost" disabled={isLocked} onClick={() => { setSubwoofer(c => ({...c, phase: p})); void setPhase(6, p); }} className={`h-full rounded-2xl border text-2xl font-black ${subwoofer.phase === p ? "border-cyan-400/50 bg-cyan-500/15 text-white" : "border-white/5 bg-white/2 text-white/30"}`}>
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
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="space-y-4">
                                            <RangeControl label="Reverb Size" value={reverb.room} display={`${reverb.room}%`} min={0} max={100} step={1} disabled={isLocked} onChange={(v: number[]) => { setReverbState(c => ({...c, room: v[0]})); void setReverb(3, v[0]); }} />
                                            <RangeControl label="Echo Decay" value={echo.delay} display={formatMs(echo.delay)} min={0} max={600} step={1} disabled={isLocked} onChange={(v: number[]) => { setEchoState(c => ({...c, delay: v[0]})); void setEcho(2, v[0]); }} />
                                        </div>
                                        <div className="space-y-3">
                                            {FX_TOGGLES.map((f) => (
                                                <button key={f.id} disabled={isLocked} onClick={() => { const next = !featureStates[f.id]; setFeatureStates(c => ({...c, [f.id]: next})); void toggleFeature(f.id, next); }} className={`flex w-full items-center justify-between rounded-2xl border p-4 transition-all ${featureStates[f.id] ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/5 bg-white/2"} ${isLocked ? "opacity-40" : ""}`}>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black uppercase tracking-[0.1em] text-white">{f.label}</p>
                                                        <p className="text-[10px] text-white/40">{f.caption}</p>
                                                    </div>
                                                    <div className={`h-3 w-3 rounded-full ${featureStates[f.id] ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-white/10"}`} />
                                                </button>
                                            ))}
                                        </div>
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
        <TabsTrigger value={value} className={`flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all md:flex-row md:py-3 ${active ? "bg-cyan-500/15 text-white shadow-[inset_0_0_0_1px_rgba(90,221,255,0.2)]" : "text-white/40 hover:text-white/60"}`}>
            <Icon className="h-4.5 w-4.5 md:h-4 md:w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] md:text-xs md:tracking-[0.2em]">{label}</span>
        </TabsTrigger>
    );
}

function SectionCard({ title, description, icon: Icon, children }: any) {
    return (
        <Card className="border-white/10 bg-white/4 shadow-none rounded-[2rem] overflow-hidden">
            <CardHeader className="p-5 pb-2 md:p-8">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black text-white">{title}</CardTitle>
                        <CardDescription className="text-xs text-white/40 md:text-sm">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 md:p-8 md:pt-0">{children}</CardContent>
        </Card>
    );
}

function StatusTile({ icon: Icon, label, value }: any) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-3 ring-1 ring-white/5 min-w-[160px]">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                <Icon className="h-3 w-3" /> {label}
            </div>
            <p className="mt-1 text-sm font-bold text-white/80">{value}</p>
        </div>
    );
}

function RangeControl({ label, value, display, min, max, step, disabled, onChange, compact }: any) {
    return (
        <div className={`rounded-3xl border border-white/5 bg-black/30 w-full ${compact ? "p-3" : "p-4 md:p-6"}`}>
            <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
                <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] font-black text-cyan-400">{display}</span>
            </div>
            <Slider disabled={disabled} min={min} max={max} step={step} value={[clamp(value, min, max)]} onValueChange={onChange} />
        </div>
    );
}

export default DSPDashboard;
