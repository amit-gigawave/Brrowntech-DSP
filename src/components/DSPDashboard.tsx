"use client";

import React, { useState } from 'react';
import { useBluetooth } from '@/lib/bluetooth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Settings2, Sliders, Waves, 
    Mic2, Layers, Speaker, Zap,
    Bluetooth, Radio, Cable, Disc,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DSPDashboard = () => {
    const { 
        isConnected, deviceName,
        setVolume, selectInput, setEQ, 
        setSubwooferParam, setPhase, toggleFeature
    } = useBluetooth();

    const [activeTab, setActiveTab] = useState("mixer");

    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-4 md:mt-8 pb-32 relative">
            <Card className="glass-dark border-white/10 shadow-2xl relative overflow-hidden">
                {!isConnected && (
                    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <Lock className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">System Offline</h3>
                        <p className="text-white/40 max-w-xs text-sm">
                            Connect your BP10 device via Bluetooth to unlock professional audio processing.
                        </p>
                    </div>
                )}

                <CardHeader className="border-b border-white/5 bg-white/2 backdrop-blur-3xl px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">
                                BP10 DSP CONSOLE
                            </CardTitle>
                            <CardDescription className="text-white/40 mt-1 font-medium">
                                Pro Audio Routing • {isConnected ? deviceName : "Hardware Not Found"}
                            </CardDescription>
                        </div>
                        <InputSelector onSelect={selectInput} active={isConnected} />
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    <Tabs defaultValue="mixer" className="w-full" onValueChange={setActiveTab}>
                        <div className="bg-black/20 border-b border-white/5 px-8 pt-4">
                            <TabsList className="bg-transparent gap-6 h-auto p-0 border-none">
                                <TabTrigger value="mixer" icon={<Sliders className="w-4 h-4" />} label="Mixer" active={activeTab === "mixer"} />
                                <TabTrigger value="eq" icon={<Settings2 className="w-4 h-4" />} label="10-Band EQ" active={activeTab === "eq"} />
                                <TabTrigger value="sub" icon={<Speaker className="w-4 h-4" />} label="Subwoofer" active={activeTab === "sub"} />
                                <TabTrigger value="fx" icon={<Waves className="w-4 h-4" />} label="Effects" active={activeTab === "fx"} />
                            </TabsList>
                        </div>

                        <div className="p-8">
                            <TabsContent value="mixer" className="mt-0 outline-none">
                                <MixerSection setVolume={setVolume} />
                            </TabsContent>

                            <TabsContent value="eq" className="mt-0 outline-none">
                                <EQSection setEQ={setEQ} />
                            </TabsContent>

                            <TabsContent value="sub" className="mt-0 outline-none">
                                <SubSection setSubParam={setSubwooferParam} setPhase={setPhase} />
                            </TabsContent>

                            <TabsContent value="fx" className="mt-0 outline-none">
                                <FXSection toggleFeature={toggleFeature} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Subcomponents ---

const InputSelector = ({ onSelect, active }: { onSelect: (s: number) => void, active: boolean }) => {
    const [selected, setSelected] = useState(1);
    const inputs = [
        { id: 1, label: "BT", icon: <Bluetooth className="w-4 h-4" /> },
        { id: 2, label: "AUX", icon: <Cable className="w-4 h-4" /> },
        { id: 3, label: "OPT", icon: <Zap className="w-4 h-4" /> },
        { id: 4, label: "COAX", icon: <Disc className="w-4 h-4" /> },
    ];

    return (
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {inputs.map((input) => (
                <Button
                    key={input.id}
                    variant="ghost"
                    size="sm"
                    disabled={!active}
                    onClick={() => { setSelected(input.id); onSelect(input.id); }}
                    className={`gap-2 rounded-lg transition-all px-4 ${selected === input.id ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    {input.icon}
                    <span className="font-bold text-xs">{input.label}</span>
                </Button>
            ))}
        </div>
    );
};

const TabTrigger = ({ value, icon, label, active }: any) => (
    <TabsTrigger 
        value={value} 
        className={`
            flex items-center gap-2 pb-4 pt-1 px-1 bg-transparent border-b-2 rounded-none transition-all outline-none
            ${active ? 'border-blue-500 text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.5)]' : 'border-transparent text-white/40 hover:text-white/60'}
        `}
    >
        {icon}
        <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
    </TabsTrigger>
);

const MixerSection = ({ setVolume }: { setVolume: (ch: number, vol: number) => void }) => {
    const channels = [
        { id: 1, label: "FRONT LEFT", key: "FL" },
        { id: 2, label: "FRONT RIGHT", key: "FR" },
        { id: 3, label: "REAR LEFT", key: "RL" },
        { id: 4, label: "REAR RIGHT", key: "RR" },
        { id: 6, label: "SUBWOOFER", key: "SUB" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-10 px-4">
            {channels.map((ch) => (
                <div key={ch.id} className="flex flex-col items-center gap-12 p-8 glass-dark rounded-[3rem] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden h-[450px] md:h-[550px] shadow-2xl">
                    <div className="w-full flex justify-between items-center px-2 relative z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-black tracking-[0.5em]">{ch.key}</span>
                        <Speaker className="w-4 h-4 text-white/40 group-hover:text-blue-500/80 transition-colors" />
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center relative z-10 py-6">
                        <Slider
                            orientation="vertical"
                            defaultValue={[10]}
                            max={16}
                            onValueChange={(v: number[]) => setVolume(ch.id, v[0])}
                            className="h-full"
                        />
                    </div>

                    <div className="text-center relative z-10 mt-auto">
                        <p className="text-[10px] font-black text-white/50 group-hover:text-white uppercase tracking-[0.3em] transition-colors">{ch.label}</p>
                    </div>

                    {/* Gradient highlight */}
                    <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
            ))}
        </div>
    );
};

const EQSection = ({ setEQ }: { setEQ: (band: number, type: number, val: number) => void }) => {
    const frequencies = ["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];

    return (
        <div className="space-y-10 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-center justify-between gap-4 min-w-[900px] px-4">
                {frequencies.map((freq, band) => (
                    <div key={band} className="flex flex-col items-center gap-8 p-5 glass-dark border border-white/5 rounded-[2rem] flex-1 backdrop-blur-md group hover:border-blue-500/20 transition-all">
                        <div className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]">
                            {freq}Hz
                        </div>
                        <div className="h-56">
                            <Slider
                                orientation="vertical"
                                defaultValue={[0]}
                                min={-12}
                                max={12}
                                step={0.5}
                                onValueChange={(v: number[]) => setEQ(band, 4, v[0])}
                                className="h-full"
                            />
                        </div>
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest group-hover:text-white/40 transition-colors">BAND {band + 1}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center pt-4">
                <Button variant="outline" className="bg-white/2 border-white/5 hover:bg-blue-600/20 hover:border-blue-500/50 gap-3 rounded-2xl h-14 px-10 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl">
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400/20" /> Reset to Flat
                </Button>
            </div>
        </div>
    );
};

const SubSection = ({ setSubParam, setPhase }: { setSubParam: (id: number, val: number) => void, setPhase: (ch: number, ph: number) => void }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-8">
            <Card className="glass-dark border-white/10 p-8 space-y-8 text-center ring-1 ring-white/5">
                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center justify-center gap-3">
                    <Speaker className="w-5 h-5 text-blue-400" />
                    Sub Filter (LPF)
                </h3>
                <Slider 
                    defaultValue={[80]} 
                    min={20} 
                    max={200} 
                    onValueChange={(v: number[]) => setSubParam(1, v[0])} 
                />
                <div className="flex justify-between text-[10px] text-white/30 uppercase font-black tracking-widest">
                    <span>20Hz</span>
                    <span className="text-blue-400 text-lg">80Hz</span>
                    <span>200Hz</span>
                </div>
            </Card>

            <Card className="glass-dark border-white/10 p-8 flex flex-col justify-between text-center ring-1 ring-white/5">
                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center justify-center gap-3 mb-8">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Phase Control
                </h3>
                <div className="flex gap-4">
                    <Button 
                        className="flex-1 rounded-3xl py-10 text-xl font-black bg-white/2 hover:bg-blue-600/20 border-white/5 hover:border-blue-500/50" 
                        variant="outline"
                        onClick={() => setPhase(3, 0)}
                    >
                        0°
                    </Button>
                    <Button 
                        className="flex-1 rounded-3xl py-10 text-xl font-black bg-white/2 hover:bg-indigo-600/20 border-white/5 hover:border-indigo-500/50" 
                        variant="outline"
                        onClick={() => setPhase(3, 1)}
                    >
                        180°
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const FXSection = ({ toggleFeature }: any) => {
    const features = [
        { id: 0x0D, label: "Vocal Elimination", desc: "Digital Voice Removal", icon: <Mic2 className="w-6 h-6" /> },
        { id: 0x0E, label: "Stereo Enhance", desc: "Wide Stage Expansion", icon: <Layers className="w-6 h-6" /> },
        { id: 0x0F, label: "3D Spatial Audio", desc: "Surround Immersion", icon: <Waves className="w-6 h-6" /> },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto py-8">
            {features.map((f) => (
                <FeatureToggle key={f.id} feature={f} onToggle={(on: boolean) => toggleFeature(f.id, on)} />
            ))}
        </div>
    );
};

const FeatureToggle = ({ feature, onToggle }: { feature: any, onToggle: (on: boolean) => void }) => {
    const [enabled, setEnabled] = useState(false);
    return (
        <button
            onClick={() => { setEnabled(!enabled); onToggle(!enabled); }}
            className={`
                group relative p-8 rounded-[2.5rem] border transition-all duration-500 text-left overflow-hidden flex flex-col justify-between h-64
                ${enabled ? 'bg-blue-600/20 border-blue-500/50 shadow-2xl shadow-blue-500/20' : 'bg-white/3 border-white/5 hover:border-white/20'}
            `}
        >
            <div className={`
                w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-500
                ${enabled ? 'bg-blue-500 shadow-lg shadow-blue-500/50 text-white' : 'bg-white/5 text-white/40'}
            `}>
                {feature.icon}
            </div>

            <div>
                <h4 className={`text-xl font-black uppercase tracking-tighter mb-1 transition-colors ${enabled ? 'text-white' : 'text-white/60'}`}>
                    {feature.label}
                </h4>
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-[0.2em] font-black">
                    {feature.desc}
                </p>
            </div>

            <div className="absolute top-8 right-8">
                <Badge className={`${enabled ? 'bg-blue-500' : 'bg-white/10 text-white/20 font-bold tracking-widest text-[9px]'}`}>
                    {enabled ? "ACTIVE" : "OFFLINE"}
                </Badge>
            </div>
            
            <AnimatePresence>
                {enabled && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-transparent pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </button>
    );
};

export default DSPDashboard;
