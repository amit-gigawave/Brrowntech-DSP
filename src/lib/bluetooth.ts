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
        // BP10 Custom Protocol UUIDs
        const SERVICE_UUID = '0000ab00-0000-1000-8000-00805f9b34fb';
        const CHARACTERISTIC_UUID = '0000ab01-0000-1000-8000-00805f9b34fb';

        if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
            console.error("Web Bluetooth is not supported.");
            alert("Bluetooth is missing. \n\n• iOS: Use the 'Bluefy' browser.\n• Android: Use Chrome.\n• PC: Use Chrome/Edge.");
            return;
        }

        try {
            console.log("Stage 1: Hardware Filtering...");
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: [SERVICE_UUID] }],
                optionalServices: [SERVICE_UUID, 'device_information', 'generic_access']
            });

            console.log(`Stage 2: Linking to ${this.device.name}...`);
            const server = await this.device.gatt?.connect();
            if (!server) throw new Error("GATT Link Failure");

            // --- MOBILE STABILITY OPTIMIZATION ---
            // Large walk-throughs (getPrimaryServices) often crash mobile BLE stacks.
            // We switch to a targeted discovery model that is fast yet thorough enough to 'wake' the chip.
            console.log("Stage 3: Protocol Negotiation...");
            
            // 1. Precise Service Discovery
            const mainService = await server.getPrimaryService(SERVICE_UUID);
            this.characteristic = await mainService.getCharacteristic(CHARACTERISTIC_UUID);

            if (!this.characteristic) {
                throw new Error("Target Endpoint 0xAB01 not responding.");
            }

            // 2. Hardware 'Execute' Signal (Notifications)
            // Mirroring BLE scanner: Activating feedback loop signals 'App Ready' to the DSP
            if (this.characteristic.properties.notify) {
                this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
                    const target = event.target as any;
                    const val = target?.value;
                    if (val) console.log(`[HARDWARE] <== ACK (${val.byteLength} bytes)`);
                });
                
                console.log("  > Activating Real-time Channel...");
                await this.characteristic.startNotifications().catch(() => null);
            }

            // 3. Warm-up Poke (Reading Generic Info)
            // Reading the characteristic once force-refreshes the device's internal attribute pointer
            if (this.characteristic.properties.read) {
                await this.characteristic.readValue().catch(() => null);
            }

            // 4. Settling Period
            // Mobile devices need a moment to stabilize the radio after MTU negotiation
            console.log("Stage 4: Finalizing Bridge...");
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.onStateChange(true);
            console.log("BP10 STATUS: ONLINE");

            this.device.addEventListener('gattserverdisconnected', () => {
                console.warn("Signal Lost. Cleaning session...");
                this.onStateChange(false);
                this.device = null;
                this.characteristic = null;
            });

            return this.device.name;
        } catch (error: any) {
            this.onStateChange(false);
            // Handle User Cancelled specially to avoid noisy alerts
            if (error.name === 'NotFoundError') {
                console.log("Selection Cancelled by User");
            } else {
                console.error("Critical Connection Error:", error);
                throw error;
            }
        }
    }

    async disconnect() {
        try {
            if (this.characteristic?.properties?.notify) {
                await this.characteristic.stopNotifications().catch(() => null);
            }
            if (this.device?.gatt?.connected) {
                await this.device.gatt.disconnect();
            }
        } catch (e) {
            console.warn("Cleanup error", e);
        } finally {
            this.onStateChange(false);
            this.device = null;
            this.characteristic = null;
        }
    }

    private isWriting = false;
    private commandQueue: Uint8Array[] = [];

    async sendCommand(bytes: number[]) {
        if (!this.characteristic && !this.isSimulated) return;

        // BP10 Protocol requires 0x0D 0x0A (CRLF) termination
        const payload = [...bytes, 0x0D, 0x0A];
        const packet = new Uint8Array(payload.length);
        packet.set(payload);

        // Smart De-duplication Logic
        if (bytes.length >= 2) {
            const cmd = bytes[0];
            const target = bytes[1];
            const sub = bytes.length >= 3 ? bytes[2] : null;

            this.commandQueue = this.commandQueue.filter(q => {
                if (q[0] !== cmd) return true;
                if (q[1] !== target) return true;
                if (sub !== null && q[2] !== sub) return true;
                return false;
            });
        }

        this.commandQueue.push(packet);

        // UI Feedback
        const hex = Array.from(packet).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        this.onCommandSent?.(hex);

        if (!this.isWriting) this.processQueue();
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
            console.log(`[SIMULATOR] ==> ${packet}`);
            this.isWriting = false;
            setTimeout(() => this.processQueue(), 10);
            return;
        }

        try {
            // RELIABILITY: Hybrid Write Logic
            const props = this.characteristic.properties;
            if (props.write) {
                await this.characteristic.writeValueWithResponse(packet);
            } else {
                await this.characteristic.writeValueWithoutResponse(packet);
            }
        } catch (e) {
            console.error("Write failed", e);
            this.commandQueue = []; // Clear queue on hardware fault
        } finally {
            this.isWriting = false;
            // Cooldown for hardware stability
            setTimeout(() => this.processQueue(), 80);
        }
    }

    // --- Command Set ---

    async selectInput(source: number) { 
        await this.sendCommand([0x01, source]); 
    }
    
    async setVolume(ch: number, vol: number) { 
        await this.sendCommand([0x02, ch, Math.min(16, Math.max(0, vol))]); 
    }
    
    async setEQ(band: number, type: number, value: number) {
        let val = 0;
        if (type === 4) val = Math.round(value * 256);      // Gain Q8.8
        else if (type === 3) val = Math.round(value * 1024); // Q Q6.10
        else val = Math.round(value);
        
        await this.sendCommand([0x04, band, type, val & 0xFF, (val >> 8) & 0xFF]);
    }

    async setSubwooferParam(id: number, value: number) {
        const val = id === 0 ? Math.round(value * 256) : Math.round(value);
        await this.sendCommand([0x07, id, val & 0xFF, (val >> 8) & 0xFF]);
    }

    async setPhase(ch: number, ph: number) { 
        await this.sendCommand([0x08, ch, ph]); 
    }
    
    async setReverb(id: number, val: number) { 
        await this.sendCommand([0x0B, id, val & 0xFF, (val >> 8) & 0xFF]); 
    }
    
    async setEcho(id: number, val: number) { 
        await this.sendCommand([0x0C, id, val & 0xFF, (val >> 8) & 0xFF]); 
    }
    
    async toggleFeature(cmd: number, on: boolean) { 
        await this.sendCommand([cmd, on ? 1 : 0]); 
    }
}
