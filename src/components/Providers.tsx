"use client";

import { BluetoothProvider } from "@/lib/bluetooth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BluetoothProvider>
      {children}
    </BluetoothProvider>
  );
}
