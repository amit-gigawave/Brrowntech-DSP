# Technical Protocol Specification: Brrowntech DSP Control System

This document outlines the low-level communication architecture used by the **Brrowntech DSP Dashboard** to control BP10 hardware via the **Web Bluetooth API**.

---

## 1. Communication Architecture

The system utilizes a **Client-Side Binary Bridge** built on the Web Bluetooth GATT (Generic Attribute Profile) specification. 

- **Internal Representation**: All DSP parameters are calculated as floating-point numbers and then cast into **unsigned 8-bit integers (`Uint8Array`)**.
- **Data Transfer Type**: Strictly **Binary Byte Arrays**. No Unicode or ASCII-string encoding is used for the core command payload, preventing data corruption and hardware-level parsing errors.

## 2. Command Frame Anatomy

Every transmission to the DSP hardware follows a **Strict Variable-Length Frame**. The payload contains **only the instruction bytes** as specified in the BP10 manual. 

### **Packet Structure Details**
- **No Terminators**: The system does not append Carriage Return (`0x0D`) or New Line (`0x0A`).
- **No Padding**: Packets are precisely the length of the binary instruction.
- **Example (Volume Command)**: `[0x02, 0x01, 0x0A]` (Exactly 3 bytes transmitted).

### **Final Hardware Discovery Specifications**
| Type | Value |
| :--- | :--- |
| **Service UUID** | `0000ab00-0000-1000-8000-00805f9b34fb` |
| **Write Characteristic** | `0000ab01-0000-1000-8000-00805f9b34fb` |
| **Write Method** | `writeValueWithoutResponse` |

---

## 3. Protocol Verification

The hardware is now configured for high-performance direct-binary writes. During testing, verify:

1.  **Instruction Response**: Ensure the device executes the command immediately upon receiving the final byte of the instruction.
2.  **Hex vs ASCII Encoding**: Confirm that the device's internal UART is correctly interpreting the raw `Uint8Array` rather than expecting a text-encoded hex string.

---

## 4. Advanced Flow Control & Stability

To ensure stability across various hardware modules, we have implemented a **Sequential Logic Queue**:

1.  **50ms Throttle Control**: To prevent the "GATT Error Unknown" commonly caused by overwhelming the hardware's internal UART or Serial buffer, the app enforces a 50ms pause between every write operation.
2.  **Smart De-duplication**: When a slider is moved rapidly, the dashboard ignores intermediate states and only queues the latest value for the specific Command ID. This reduces BLE traffic by ~80% while maintaining real-time responsiveness.
3.  **Hardware Write Protocol**: We utilize `writeValueWithResponse` or `writeValueWithoutResponse` depending on the device's specific MTU (Maximum Transmission Unit) capabilities, automatically detected during the discovery phase.

---

## 4. Precision Scaling Logic

The dashboard implements bit-perfect conversions for audio parameters as defined by the hardware's numerical format requirements:

| Parameter | Unit | Scaling Format | Software Logic |
| :--- | :--- | :--- | :--- |
| **Gain / Level** | dB | **Q8.8 Signed** | `(Value * 256)` -> split into `lo` / `hi` bytes |
| **Equalizer Q** | Q | **Q6.10 Fixed** | `(Value * 1024)` -> split into `lo` / `hi` bytes |
| **Frequency** | Hz | **Integer**| Raw value (binary) |

---

## 5. Deployment Environment

For the client to use this application with physical hardware, the following browser security requirements must be met:
- **HTTPS Protocol**: Browsers strictly forbid Web Bluetooth access over insecure `http://` connections (except for `localhost`).
- **Browser Compatibility**: Recommended: **Google Chrome** or **Microsoft Edge** (Chromium-based).
- **iOS Devices**: Requires a Web Bluetooth-capable browser such as **Bluefy** (Standard Safari does not support BLE).

---

**Proprietary Document — Brrowntech Technical Specifications**
