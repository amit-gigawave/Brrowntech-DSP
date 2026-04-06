"use client";

import React, { useState } from 'react';
import { useBluetooth } from '@/lib/bluetooth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Slider } from './ui/slider';

const VolumeTest = () => {
    const { isConnected, setVolume, deviceName } = useBluetooth();
    const [vol, setVol] = useState(8); // Default 8 (midpoint of 0-16)

    const handleVolumeChange = async (value: number[]) => {
        const newVol = value[0];
        setVol(newVol);
        if (isConnected) {
            try {
                // Send command for ALL channels (channel index 5 per manual)
                await setVolume(5, newVol);
            } catch (error) {
                console.error("Failed to send volume command", error);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-auto"
        >
            <Card className={`glass-dark border-white/10 ${!isConnected ? 'opacity-50 grayscale' : 'shadow-blue-500/10 shadow-2xl'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                        {isConnected ? `Testing: ${deviceName}` : "Device Not Connected"}
                    </CardTitle>
                    {isConnected ? (
                        <Volume2 className="h-4 w-4 text-blue-400" />
                    ) : (
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    )}
                </CardHeader>
                <CardContent className="pt-6 pb-8">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-white tabular-nums">
                                {vol.toString().padStart(2, '0')}
                            </span>
                            <span className="text-white/30 text-xs font-mono uppercase tracking-widest">
                                Master Volume (0-16)
                            </span>
                        </div>

                        <div className="relative pt-4">
                            <Slider
                                disabled={!isConnected}
                                value={[vol]}
                                max={16}
                                step={1}
                                onValueChange={handleVolumeChange}
                                className="z-10"
                            />
                            {/* Visual slider track background decoration */}
                            <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-white/5 rounded-full -z-10" />
                        </div>

                        {!isConnected && (
                            <p className="text-[10px] text-center text-red-400/80 uppercase tracking-tighter bg-red-500/5 py-2 rounded-lg border border-red-500/10">
                                Connect via the Bluetooth button above to test commands
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default VolumeTest;
