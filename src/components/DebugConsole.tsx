"use client";

import React, { useState } from 'react';
import { useBluetooth } from '@/lib/bluetooth-context';
import { Terminal, Trash2, ChevronUp, ChevronDown, CheckCircle2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DebugConsole = () => {
    const { isConnected, commandLogs, simulateConnect } = useBluetooth();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isConnected && commandLogs.length === 0) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button 
                    onClick={simulateConnect}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-full hover:bg-blue-600/30 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10"
                >
                    <Zap className="w-4 h-4" /> Start Virtual Simulation
                </button>
            </div>
        );
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${isExpanded ? 'h-96' : 'h-12'}`}>
            <div className="h-full max-w-7xl mx-auto glass-dark border-t border-x border-white/10 rounded-t-[2.5rem] overflow-hidden shadow-2xl">
                {/* Header */}
                <div 
                    className="h-12 flex items-center justify-between px-8 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                            Protocol Debugger • {isConnected ? "Hardware Active" : "Simulated"}
                        </span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>

                {/* Log Content */}
                <div className="p-6 h-[calc(100%-3rem)] overflow-y-auto font-mono text-sm space-y-3 bg-black/40">
                    <AnimatePresence initial={false}>
                        {commandLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 uppercase tracking-widest text-[10px]">
                                <Terminal className="w-8 h-8 mb-4 opacity-10" />
                                Waiting for hardware commands...
                            </div>
                        ) : (
                            commandLogs.map((log, i) => (
                                <motion.div 
                                    key={i + log}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-4 p-3 rounded-xl bg-white/2 border border-white/5 group hover:border-blue-500/20 transition-colors"
                                >
                                    <div className="text-blue-500/40 text-[10px] pt-1">
                                        [{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                    </div>
                                    <div className="flex-1 text-white/80 break-all leading-relaxed tracking-wider">
                                        {log}
                                    </div>
                                    <CheckCircle2 className="w-3 h-3 text-green-500/40 self-center" />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DebugConsole;
