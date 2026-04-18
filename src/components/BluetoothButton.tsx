"use client";

import React, { useState } from 'react';
import { Bluetooth, BluetoothConnected, Loader2, PowerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBluetooth } from '@/lib/bluetooth-context';

const BluetoothButton = () => {
    const { isConnected, connect, disconnect, deviceName } = useBluetooth();
    const [isScanning, setIsScanning] = useState(false);

    const handleBluetoothAction = async () => {
        if (isConnected) {
            await disconnect();
            return;
        }

        if (!window.isSecureContext && window.location.hostname !== "localhost") {
            alert("SECURITY ERROR: Web Bluetooth requires an HTTPS connection. Please use an HTTPS tunnel (like ngrok) or host it professionally.");
            return;
        }

        if (!(navigator as any).bluetooth) {
            alert("BROWSER NOT SUPPORTED: This browser does not support Web Bluetooth. \n\n• If you are on iOS/iPhone, please use the 'Bluefy' browser from the App Store. \n• If you are on Android, use Chrome.");
            return;
        }

        try {
            setIsScanning(true);
            await connect();
        } catch (error: any) {
            console.error("Bluetooth connection failed:", error);
            if (error.name !== 'NotFoundError' && error.name !== 'UserCancelledError') {
                alert("ERROR: " + (error.message || "Failed to connect to device"));
            } else if (error.name === 'NotFoundError') {
                alert("DIAGNOSTIC: Browser reported 'NotFoundError'. This usually means you hit Cancel or no physical devices were found nearby.");
            }
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                {/* Visual indicator for scanning/connection */}
                <AnimatePresence>
                    {(isScanning || isConnected) && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: isConnected ? [1.2, 1.3, 1.2] : 1.5,
                                opacity: isConnected ? 0.2 : 0.4
                            }}
                            exit={{ scale: 2, opacity: 0 }}
                            transition={{
                                repeat: Infinity,
                                duration: isConnected ? 3 : 1.5,
                                ease: "easeInOut"
                            }}
                            className={`absolute inset-0 rounded-full ${isConnected ? 'bg-green-500' : 'bg-blue-500'}`}
                        />
                    )}
                </AnimatePresence>

                <Button
                    onClick={handleBluetoothAction}
                    disabled={isScanning}
                    className={`
                        relative z-10 w-24 h-24 rounded-3xl shadow-2xl transition-all duration-500
                        ${isConnected ? 'bg-green-600/20 backdrop-blur-xl border-green-500/50 hover:bg-red-600/20 group' : 'bg-linear-to-br from-blue-500/80 to-indigo-600/80 hover:shadow-blue-500/40 cursor-pointer border-white/20'}
                        flex items-center justify-center active:scale-95 overflow-hidden
                    `}
                >
                    {isScanning ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    ) : isConnected ? (
                        <>
                            <BluetoothConnected className="w-12 h-12 text-green-400 group-hover:opacity-0 transition-opacity" />
                            <PowerOff className="absolute w-10 h-10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    ) : (
                        <Bluetooth className="w-12 h-12 text-white" />
                    )}

                    {/* Interior Glow */}
                    <div className={`absolute inset-0 opacity-20 pointer-events-none ${isConnected ? 'bg-green-400 blur-2xl' : 'bg-white blur-2xl'}`} />
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {isConnected ? (
                    <motion.div
                        key="connected"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className="text-xs font-bold px-6 py-2 bg-green-500/10 backdrop-blur-md rounded-full border border-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            ONLINE: <span className="text-white ml-2">{deviceName}</span>
                        </div>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium mt-2">
                            Connected via Secure GATT
                        </p>
                    </motion.div>
                ) : (
                    <motion.p
                        key="instruction"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        className="text-white/60 text-sm font-medium tracking-wide flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Ready to Connect
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BluetoothButton;


