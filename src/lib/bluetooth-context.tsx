"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { BluetoothService } from './bluetooth';

interface BluetoothContextType {
    isConnected: boolean;
    deviceName: string | null;
    commandLogs: string[];
    connect: () => Promise<void>;
    simulateConnect: () => Promise<void>;
    disconnect: () => Promise<void>;
    setVolume: (channel: number, level: number) => Promise<void>;
    selectInput: (source: number) => Promise<void>;
    setEQ: (band: number, type: number, value: number) => Promise<void>;
    setSubwooferParam: (id: number, value: number) => Promise<void>;
    setPhase: (channel: number, phase: number) => Promise<void>;
    setReverb: (paramId: number, value: number) => Promise<void>;
    setEcho: (paramId: number, value: number) => Promise<void>;
    toggleFeature: (cmd: number, on: boolean) => Promise<void>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const [commandLogs, setCommandLogs] = useState<string[]>([]);
    const serviceRef = useRef<BluetoothService | null>(null);

    const logCommand = useCallback((hex: string) => {
        setCommandLogs(prev => [hex, ...prev].slice(0, 50));
    }, []);

    if (!serviceRef.current) {
        serviceRef.current = new BluetoothService((status) => {
            setIsConnected(status);
            if (!status) setDeviceName(null);
        }, logCommand);
    }

    const connect = async () => {
        try {
            const name = await serviceRef.current?.connect();
            setDeviceName(name || "BP10 Device");
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const simulateConnect = async () => {
        const name = await serviceRef.current?.simulateConnect();
        setDeviceName(name || "SIMULATED_DEVICE");
    };

    const disconnect = async () => {
        await serviceRef.current?.disconnect();
    };

    const setVolume = (channel: number, level: number) => serviceRef.current!.setVolume(channel, level);
    const selectInput = (source: number) => serviceRef.current!.selectInput(source);
    const setEQ = (band: number, type: number, value: number) => serviceRef.current!.setEQ(band, type, value);
    const setSubwooferParam = (id: number, value: number) => serviceRef.current!.setSubwooferParam(id, value);
    const setPhase = (channel: number, phase: number) => serviceRef.current!.setPhase(channel, phase);
    const setReverb = (paramId: number, value: number) => serviceRef.current!.setReverb(paramId, value);
    const setEcho = (paramId: number, value: number) => serviceRef.current!.setEcho(paramId, value);
    const toggleFeature = (cmd: number, on: boolean) => serviceRef.current!.toggleFeature(cmd, on);

    return (
        <BluetoothContext.Provider value={{ 
            isConnected, deviceName, commandLogs, connect, simulateConnect, disconnect, 
            setVolume, selectInput, setEQ, setSubwooferParam, 
            setPhase, setReverb, setEcho, toggleFeature 
        }}>
            {children}
        </BluetoothContext.Provider>
    );
};

export const useBluetooth = () => {
    const context = useContext(BluetoothContext);
    if (!context) {
        throw new Error("useBluetooth must be used within a BluetoothProvider");
    }
    return context;
};
