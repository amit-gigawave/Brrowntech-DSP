"use client";

/**
 * Service to handle BP10 Bluetooth DSP communication
 */
export class BluetoothService {
    private device: any | null = null;
    private characteristic: any | null = null;
    private onStateChange: (connected: boolean) => void;
    private onCommandSent?: (hex: string) => void;
    private isSimulated = false;

    constructor(onStateChange: (connected: boolean) => void, onCommandSent?: (hex: string) => void) {
        this.onStateChange = onStateChange;
        this.onCommandSent = onCommandSent;
    }

    async simulateConnect() {
        this.isSimulated = true;
        this.onStateChange(true);
        return "BRROWNTECH_VIRTUAL_DEVICE";
    }

    async connect() {
        try {
            // Request device - accepting all for discovery
            this.device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                // These are common services for serial-to-BLE modules
                optionalServices: [
                    '0000ffe0-0000-1000-8000-00805f9b34fb', // Common serial
                    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic NUS
                    '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
                ]
            });

            const server = await this.device.gatt?.connect();
            if (!server) throw new Error("Failed to connect to GATT server");

            this.onStateChange(true);

            // Discover and find the first writable characteristic
            const services = await server.getPrimaryServices();
            for (const service of services) {
                const characteristics = await service.getCharacteristics();
                for (const char of characteristics) {
                    if (char.properties.write || char.properties.writeWithoutResponse) {
                        this.characteristic = char;
                        console.log(`Using characteristic: ${char.uuid} for command transmission`);
                        break;
                    }
                }
                if (this.characteristic) break;
            }

            if (!this.characteristic) {
                throw new Error("No writable characteristic found on this device");
            }

            this.device.addEventListener('gattserverdisconnected', () => {
                this.onStateChange(false);
                this.device = null;
                this.characteristic = null;
            });

            return this.device.name;
        } catch (error) {
            this.onStateChange(false);
            console.error("Bluetooth connection failed", error);
            throw error;
        }
    }

    async disconnect() {
        if (this.device?.gatt?.connected) {
            await this.device.gatt.disconnect();
        }
        this.onStateChange(false);
    }

    private isWriting = false;
    private commandQueue: Uint8Array[] = []; // Unified binary queue

    /**
     * Generic byte array command - now with exact-length binary queuing
     */
    async sendCommand(bytes: number[]) {
        if (!this.characteristic && !this.isSimulated) return;

        // Restore: Hardware-ready 20-byte fixed length frame
        const binaryPacket = new Uint8Array(20);
        for (let i = 0; i < bytes.length && i < 20; i++) {
            binaryPacket[i] = bytes[i];
        }

        // De-duplication Logic
        if (bytes.length >= 2) {
            const cmdType = bytes[0];
            const targetId = bytes[1];
            const subType = bytes.length >= 3 ? bytes[2] : null;

            this.commandQueue = this.commandQueue.filter(existing => {
                if (existing[0] !== cmdType) return true;
                if (existing[1] !== targetId) return true;
                if (subType !== null && existing[2] !== subType) return true;
                return false;
            });
        }

        this.commandQueue.push(binaryPacket);

        // Debug Logging
        const hexString = Array.from(binaryPacket)
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
        console.info(`[DSP BINARY] Sending ${bytes.length} bytes as 20B Hex: ${hexString}`);
        this.onCommandSent?.(hexString);

        if (this.isWriting) return;
        this.processQueue();
    }

    private async processQueue() {
        if (this.commandQueue.length === 0 || this.isWriting) return;

        if (!this.isSimulated && !this.characteristic) {
            this.commandQueue = [];
            return;
        }

        this.isWriting = true;
        const packet = this.commandQueue.shift();
        
        if (!packet) {
            this.isWriting = false;
            return;
        }

        if (this.isSimulated) {
            this.isWriting = false;
            setTimeout(() => this.processQueue(), 10);
            return;
        }

        try {
            // Sending the EXACT length of the packet as requested by the hardware
            if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(packet);
            } else {
                await this.characteristic.writeValueWithResponse(packet);
            }
        } catch (e) {
            console.error("DSP Hardware binary write failed", e);
            this.commandQueue = []; // Clear queue on error to prevent cascading failures
        }

        this.isWriting = false;
        // Increased cooldown to 50ms for slower hardware stability
        setTimeout(() => this.processQueue(), 50);
    }

    // 0x01: Input Select (1=BT, 2=AUX, 3=OPT, 4=COAX)
    async selectInput(source: number) {
        await this.sendCommand([0x01, source]);
    }

    // 0x02: PT2258 Channel (1=FL, 2=FR, 3=RL, 4=RR, 5=ALL)
    async setVolume(channel: number, level: number) {
        await this.sendCommand([0x02, channel, Math.min(16, Math.max(0, level))]);
    }

    // 0x04: EQ Param (band 0-9, param_type: 3=Q, 4=Gain)
    // Gain is Q8.8, Q is Q6.10
    async setEQ(band: number, type: number, value: number) {
        let storedValue = 0;
        if (type === 4) { // Gain
            storedValue = Math.round(value * 256);
        } else if (type === 3) { // Q
            storedValue = Math.round(value * 1024);
        } else { // F0 or others
            storedValue = Math.round(value);
        }
        
        const lo = storedValue & 0xFF;
        const hi = (storedValue >> 8) & 0xFF;
        await this.sendCommand([0x04, band, type, lo, hi]);
    }

    // 0x07: DAC_X EQ (0=Bass Boost Gain, 1=LPF Freq)
    async setSubwooferParam(id: number, value: number) {
        let val = id === 0 ? Math.round(value * 256) : Math.round(value);
        await this.sendCommand([0x07, id, val & 0xFF, (val >> 8) & 0xFF]);
    }

    // 0x08: Phase (0=0, 1=180)
    async setPhase(channel: number, phase: number) {
        await this.sendCommand([0x08, channel, phase]);
    }

    // 0x0B: Reverb (0=Dry, 1=Wet, 2=Width, 3=Room, 4=Damp)
    async setReverb(paramId: number, value: number) {
        await this.sendCommand([0x0B, paramId, value & 0xFF, (value >> 8) & 0xFF]);
    }

    // 0x0C: Echo (0=Freq, 1=Atten, 2=Delay, 3=Dry, 4=Wet)
    async setEcho(paramId: number, value: number) {
        await this.sendCommand([0x0C, paramId, value & 0xFF, (value >> 8) & 0xFF]);
    }

    // Switches (0x0D=Vocal, 0x0E=Stereo, 0x0F=3D)
    async toggleFeature(cmd: number, on: boolean) {
        await this.sendCommand([cmd, on ? 1 : 0]);
    }
}
