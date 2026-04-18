# 🎯 Client Zoom Call Agenda: BP10 DSP Connectivity

This document outlines the exact questions to ask your client during the Zoom call, along with a step-by-step debugging workflow. Keep this open during your meeting to systematically diagnose any remaining Bluetooth issues.

## Phase 1: Validating the "Scanner Mirroring" Fix
*We recently added a deep discovery loop that mimics the BLE Scanner app. The goal here is to see if this completely resolved their issue.*

**Action for Client:**  
Ask the client to completely close the external BLE Scanner app, restart their phone's Bluetooth, and try connecting *exclusively* through our Web Dashboard.

**Questions:**
1. *"When you connect using our Web Dashboard now, does the Equalizer remain responsive without using the external BLE scanner app first?"*
2. *"If it fails, does the app kick you out completely (showing 'Ready to connect'), or do the sliders just silently stop working?"*
   * **Why we ask:** If it kicks them out, it's a security/timeout drop from the phone. If the sliders stop working but say "Online", the device's internal queue overflowed.

## Phase 2: Hardware & Environment Context
*We need to isolate if the issue is hardware-specific, phone-specific, or browser-specific.*

**Questions:**
1. *"What exact brand and model of phone are you testing this on right now?"*
2. *"Are you using Google Chrome on an Android, or a specific browser on an iPhone (like Bluefy)?"*
3. *"Is the DSP board currently running on battery power or plugged into a wall?"*
   * **Why we ask:** Heavy bass loads on weak batteries can cause brown-outs that instantly kill the BLE transmission without turning off the amplifier.
4. *"Have all the DSP boards you are testing been flashed with the exact same firmware version?"*

## Phase 3: Live Debugging Workflow (If the issue persists)
If the connection is still buggy on the call, guide them through these exact steps to get us the technical logs we need.

### Step 1: Chrome Internals Check (Android Only)
If they are on Android, ask them to open a new tab in Chrome and type exactly this into the address bar:
`chrome://bluetooth-internals/#devices`
Ask them if the DSP device is showing up in that internal list.

### Step 2: The "Slider Spam" Test
1. Have them connect to the dashboard.
2. Ask them to rapidly drag a slider up and down very fast.
3. **Observe:** Does the hardware keep up, or does it crash immediately?
   * **Why we do this:** This tests our `120ms` throttle limit. If rapid dragging kills it, we need to increase our internal command delay (meaning their specific board is slower than we expected).

### Step 3: Range & Interference Check
Ask them to step 10 feet away from the board. 
Does the connection instantly get worse? The BP10 Bluetooth antennas on these boards are sometimes placed near high-voltage amplifier traces, causing massive signal interference.

---
## 💡 Notes for You (The Developer)
If the client successfully tests the app and everything works without a BLE scanner, **we have won.** The deep-discovery walk we implemented earlier fixed it. 

If it is *still* buggy, the absolute final solution to offer them is this:
> *"Web browsers restrict hardware timing heavily. If we want this to be 100% bulletproof for thousands of users, we can package this exact dashboard into a Native Android APK which bypasses all browser restrictions natively."*
