"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> {
    onValueChange?: (value: number[]) => void;
    value?: number[];
    defaultValue?: number[];
    orientation?: "horizontal" | "vertical";
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, onValueChange, value, orientation = "horizontal", ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange?.([parseFloat(e.target.value)]);
        };

        const currentValue = value?.[0] ?? props.defaultValue?.[0] ?? 0;
        const min = parseFloat(props.min?.toString() || "0");
        const max = parseFloat(props.max?.toString() || "100");
        const percentage = ((currentValue - min) / (max - min)) * 100;

        return (
            <div className={cn(
                "relative flex select-none touch-none group",
                orientation === "vertical" ? "flex-col items-center h-full w-10" : "flex-row items-center w-full h-10",
                className
            )}>
                {/* Visual Value Badge (Vertical only) */}
                {orientation === "vertical" && (
                    <div className="absolute -top-6 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/20">
                        {currentValue.toFixed(1)}
                    </div>
                )}

                <input
                    ref={ref}
                    type="range"
                    value={currentValue}
                    onChange={handleChange}
                    className={cn(
                        "absolute cursor-pointer opacity-0 z-30",
                        orientation === "vertical" ? "h-full w-full [writing-mode:bt-lr]" : "w-full h-full"
                    )}
                    style={{
                        WebkitAppearance: orientation === "vertical" ? 'slider-vertical' : undefined,
                        appearance: orientation === "vertical" ? 'slider-vertical' : undefined
                    } as any}
                    {...(props as any)}
                />
                
                {/* Custom Track Background */}
                <div className={cn(
                    "bg-white/5 rounded-full relative border border-white/5 shadow-inner transition-colors group-hover:bg-white/8",
                    orientation === "vertical" ? "w-1 h-full" : "h-1 w-full"
                )}>
                    {/* Fill Level */}
                    <div 
                        className="bg-linear-to-t from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.4)] rounded-full transition-all duration-150" 
                        style={orientation === "vertical" ? {
                            height: `${percentage}%`,
                            width: '100%',
                            position: 'absolute',
                            bottom: 0
                        } : {
                            width: `${percentage}%`,
                            height: '100%',
                            position: 'absolute',
                            left: 0
                        }}
                    />
                </div>

                {/* Professional Fader Handle (Thumb) */}
                <div 
                    className={cn(
                        "absolute z-20 transition-all duration-150 pointer-events-none",
                        "w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4),0_0_30px_rgba(59,130,246,0.6)] border-2 border-blue-500",
                        "flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-blue-600 after:rounded-full group-hover:scale-125"
                    )}
                    style={orientation === "vertical" ? {
                        bottom: `calc(${percentage}% - 8px)`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                    } : {
                        left: `calc(${percentage}% - 8px)`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                    }}
                />
            </div>
        );
    }
);

Slider.displayName = "Slider";

export { Slider };
