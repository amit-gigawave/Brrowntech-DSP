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
        const SERVICE_UUID = '0000ab00-0000-1000-8000-00805f9b34fb';
        const CHARACTERISTIC_UUID = '0000ab01-0000-1000-8000-00805f9b34fb';

        if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
            console.error("Web Bluetooth is not supported.");
            alert("Bluetooth requires an HTTPS connection and a compatible browser (Chrome/Edge/Bluefy).");
            return;
        }

        try {
            console.log("Searching for DSP Hardware...");
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: [SERVICE_UUID] }],
                optionalServices: [
                    SERVICE_UUID, 
                    'device_information', 
                    'generic_access', 
                    'generic_attribute',
                    0x1800, 0x1801, 0x180A // Explicit platform IDs
                ]
            });

            console.log(`Hardware Located: ${this.device.name}. Establishing Tunnel...`);
            const server = await this.device.gatt?.connect();
            if (!server) throw new Error("GATT Connection Failed");

            // --- AGGRESSIVE SCANNER-MIRRORING WALKER ---
            // Professional scanners work because they perform an 'Exhaustive Discovery'.
            // Many BLE-to-Serial chips won't process UART data until the GATT table is fully indexed.
            console.log("Synchronizing Attribute Table (Full Discovery)...");
            
            const services = await server.getPrimaryServices();
            let mainService = null;
            
            for (const service of services) {
                console.log(`> Indexing Service: ${service.uuid}`);
                
                // Track our target service
                if (service.uuid.toLowerCase().includes('ab00')) {
                    mainService = service;
                }

                // Discover all characteristics for this service
                const characteristics = await service.getCharacteristics().catch(() => []);
                
                for (const char of characteristics) {
                    // 1. Read 'Device Name' or 'Manufacturer' to wake up the radio logic
                    if (char.properties.read) {
                        try {
                            await char.readValue();
                            console.log(`  - Validated Attribute: ${char.uuid}`);
                        } catch(e) {}
                    }
                    
                    // 2. Mirror scanner behavior: If it notifies, we MUST subscribe 
                    // This is the #1 reason devices 'lock up' after one command (awaiting ACK loop)
                    if (char.properties.notify || char.properties.indicate) {
                        await char.startNotifications().catch(() => null);
                    }
                }

                // Small breather for the hardware bridge
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (!mainService) {
                console.log("Forcing secondary lookup for 0xAB00...");
                mainService = await server.getPrimaryService(SERVICE_UUID);
            }

            this.characteristic = await mainService.getCharacteristic(CHARACTERISTIC_UUID);

            if (!this.characteristic) {
                throw new Error("Target Endpoint 0xAB01 not found.");
            }

            // --- REDUNDANCY: Activate our specific feedback loop ---
            if (this.characteristic.properties.notify) {
                this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
                    const target = event.target as any;
                    const val = target?.value;
                    if (val) console.log(`[HARDWARE] <== ACK Received (${val.byteLength} bytes)`);
                });
                await this.characteristic.startNotifications().catch(() => null);
            }

            // Final Path Validation
            if (this.characteristic.properties.read) {
                await this.characteristic.readValue().catch(() => null);
            }

            // CRITICAL: Post-Discovery "Settle" Delay
            // Hardware needs time to write its internal CCCD values to flash/EEPROM
            console.log("Tunnel Stable. Finalizing Sync...");
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            this.onStateChange(true);
            console.log("BP10 ONLINE & READY.");

            this.device.addEventListener('gattserverdisconnected', () => {
                console.warn("Hardware Disconnected. Cleaning Handles...");
                this.onStateChange(false);
                this.device = null;
                this.characteristic = null;
            });

            return this.device.name;
        } catch (error) {
            this.onStateChange(false);
            console.error("Connection Loop Terminated", error);
            throw error;
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
