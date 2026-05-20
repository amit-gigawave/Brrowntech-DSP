"use client";

/**
 * Service to handle BP10 Bluetooth DSP communication
 */
export class BluetoothService {
    private static readonly SERVICE_UUID = '0000ab00-0000-1000-8000-00805f9b34fb';
    private static readonly CHARACTERISTIC_UUID = '0000ab01-0000-1000-8000-00805f9b34fb';
    private static readonly WRITE_GAP_MS = 120;
    private static readonly CONNECT_SETTLE_MS = 750;

    private device: any | null = null;
    private characteristic: any | null = null;
    private onStateChange: (connected: boolean) => void;
    private onCommandSent?: (hex: string) => void;
    private isSimulated = false;
    private disconnectHandler?: () => void;

    private async requestTargetDevice() {
        const bluetooth = (navigator as any).bluetooth;
        console.log("Requesting BP10 Hardware (Filtered Discovery)...");
        
        return await bluetooth.requestDevice({
            filters: [
                { services: [BluetoothService.SERVICE_UUID] },
                { namePrefix: 'BP10' }
            ],
            optionalServices: [
                BluetoothService.SERVICE_UUID,
                "device_information",
                "generic_access",
            ],
        });
    }

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
        if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
            console.error("Web Bluetooth is not supported.");
            alert("Bluetooth is missing. \n\n• iOS: Use 'Bluefy' Browser.\n• Android/PC: Use Chrome.");
            return;
        }

        try {
            this.commandQueue = [];
            this.isWriting = false;
            this.characteristic = null;

            this.device = await this.requestTargetDevice();
            console.log(`Hardware Handshake: ${this.device.name}`);
            
            const server = await this.device.gatt?.connect();
            if (!server) throw new Error("GATT Bridge Failure");

            const normalize = (uuid: string) => uuid.replace(/-/g, '').toLowerCase();
            const targetCharNorm = normalize(BluetoothService.CHARACTERISTIC_UUID);

            console.log("Exhaustive GATT Discovery Initialized...");
            await new Promise(r => setTimeout(r, 600));

            const services = await server.getPrimaryServices();
            for (const service of services) {
                console.log(`[SERVICE] Discovered: ${service.uuid}`);
                const characteristics = await service.getCharacteristics();
                
                for (const char of characteristics) {
                    const currentCharNorm = normalize(char.uuid);
                    const props = Object.keys(char.properties).filter(p => (char.properties as any)[p]).join(', ');
                    console.log(`  [CHAR] Found: ${char.uuid} (${props})`);
                    
                    if (currentCharNorm === targetCharNorm || currentCharNorm.includes('ab01')) {
                        console.log(`>>> TARGET IDENTIFIED: ${char.uuid}`);
                        this.characteristic = char;
                    }
                }
            }

            if (!this.characteristic) {
                console.warn("Target 0xAB01 not found. Attempting fuzzy fallback...");
                try {
                    const mainService = await server.getPrimaryService(BluetoothService.SERVICE_UUID);
                    const allChars = await mainService.getCharacteristics();
                    this.characteristic = allChars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
                    if (this.characteristic) console.log(`Fuzzy Success: Using ${this.characteristic.uuid}`);
                } catch (e) {
                    console.error("Fuzzy fallback failed", e);
                }
            }

            if (!this.characteristic) {
                throw new Error("Target Endpoint 0xAB01 Offline.");
            }

            console.log("Hardware Bridge Sync Verified.");
            await new Promise(resolve => setTimeout(resolve, BluetoothService.CONNECT_SETTLE_MS));

            this.onStateChange(true);
            console.log("BP10 CORE: ONLINE");

            if (this.disconnectHandler && this.device) {
                this.device.removeEventListener('gattserverdisconnected', this.disconnectHandler);
            }

            this.disconnectHandler = () => {
                console.warn("Hardware Link Terminated.");
                this.onStateChange(false);
                this.device = null;
                this.characteristic = null;
                this.commandQueue = [];
                this.isWriting = false;
            };

            this.device.addEventListener('gattserverdisconnected', this.disconnectHandler);

            return this.device.name;
        } catch (error: any) {
            this.onStateChange(false);
            this.device = null;
            this.characteristic = null;
            if (error.name === 'NotFoundError') {
                console.log("User cancelled unit discovery.");
            } else if (error.name === "SecurityError") {
                throw new Error("Bluetooth needs HTTPS and mobile Bluetooth permissions enabled.");
            } else if (error.name === "NetworkError") {
                throw new Error("Could not connect to the DSP device. Turn Bluetooth off/on on the phone and retry.");
            } else {
                console.error("GATT Tunnel Error:", error);
                throw error;
            }
        }
    }

    async disconnect() {
        try {
            if (this.characteristic?.properties?.notify || this.characteristic?.properties?.indicate) {
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
            this.commandQueue = [];
            this.isWriting = false;
        }
    }

    private isWriting = false;
    private commandQueue: Uint8Array[] = [];

    async sendCommand(bytes: number[]) {
        if (!this.characteristic && !this.isSimulated) return;

        // Raw binary instruction: No CRLF, no padding.
        const packet = new Uint8Array(bytes.length);
        packet.set(bytes);

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
        
        console.log(`[Monitor] Sending command - Decimal: [${bytes.join(', ')}], Hex: ${hex}`);
        
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
            const props = this.characteristic.properties;

            if (props.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(packet);
            } else if (props.write) {
                await this.characteristic.writeValueWithResponse(packet);
            } else {
                throw new Error("Characteristic is not writable");
            }
        } catch (e) {
            console.error("Write failed", e);
            this.commandQueue = []; // Clear queue on hardware fault
        } finally {
            this.isWriting = false;
            setTimeout(() => this.processQueue(), BluetoothService.WRITE_GAP_MS);
        }
    }

    // --- Command Set ---

    async selectInput(source: number) {
        await this.sendCommand([0x01, source]);
    }

    async setVolume(ch: number, vol: number) {
        // PT2258 Analog Volume
        await this.sendCommand([0x02, ch, Math.min(16, Math.max(0, vol))]);
    }

    async setMasterVolume(vol: number) {
        await this.setVolume(5, vol);
    }

    async setDACMasterVolume(vol: number) {
        // DAC_X Digital Volume (0x03)
        await this.sendCommand([0x03, Math.round(vol)]);
    }

    async setEQ(band: number, type: number, value: number) {
        let val = 0;
        if (type === 4 || type === 5) val = Math.round(value * 256); // Gain/Pregain Q8.8
        else if (type === 3) val = Math.round(value * 1024);         // Q Q6.10
        else val = Math.round(value);

        await this.sendCommand([0x04, band, type, val & 0xFF, (val >> 8) & 0xFF]);
    }

    async setEQGlobalEnable(on: boolean) {
        await this.sendCommand([0x04, 0, 7, on ? 1 : 0, 0]);
    }

    async setEQGlobalPregain(value: number) {
        const val = Math.round(value * 256);
        await this.sendCommand([0x04, 0, 5, val & 0xFF, (val >> 8) & 0xFF]);
    }

    async setSubwooferParam(id: number, value: number) {
        const val = id === 0 ? Math.round(value * 256) : Math.round(value);
        await this.sendCommand([0x07, id, val & 0xFF, (val >> 8) & 0xFF]);
    }

    async setBassBoost(value: number) {
        await this.setSubwooferParam(0, value);
    }

    async setSubwooferFrequency(value: number) {
        await this.setSubwooferParam(1, value);
    }

    async setSubwooferDelay(value: number) {
        // Corrected to 0x0A from manual (0..5ms)
        const val = Math.max(0, Math.min(5, Math.round(value)));
        await this.sendCommand([0x0A, val]);
    }

    async setPhase(ch: number, ph: number) {
        await this.sendCommand([0x08, ch, ph]);
    }

    async setFilterType(mode: number) {
        await this.sendCommand([0x05, mode]);
    }

    async setFilterFrequency(value: number) {
        // Corrected to 0x06 from manual
        await this.sendCommand([0x06, Math.max(60, Math.min(200, Math.round(value)))]);
    }

    async setAutoOffThreshold(value: number) {
        // Corrected to 0x09 from manual (0..3000)
        const val = Math.round(value);
        await this.sendCommand([0x09, val & 0xFF, (val >> 8) & 0xFF]);
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
