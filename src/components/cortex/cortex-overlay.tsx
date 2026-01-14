"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Radio, ShieldAlert, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface CortexOverlayProps {
    events: any[]; // Reactive stream
}

export function CortexOverlay({ events }: CortexOverlayProps) {
    const [status, setStatus] = useState<'IDLE' | 'COMBAT' | 'ANALYZING' | 'CRITICAL'>('IDLE');
    const [message, setMessage] = useState<string | null>(null);

    // React to new events
    useEffect(() => {
        if (events.length === 0) return;
        const lastEvent = events[events.length - 1];

        // 1. COMBAT DETECTION
        if (lastEvent.type === 'COMBAT_STARTED') setStatus('COMBAT');
        if (lastEvent.type === 'COMBAT_ENDED') setStatus('IDLE');

        // 2. CRITICAL HITS / FUMBLES / RESOLUTION
        if (lastEvent.type === 'ROLL' || lastEvent.type === 'ATTACK') {
            const result = lastEvent.payload?.roll?.result || lastEvent.payload?.result;
            const target = lastEvent.payload?.target || lastEvent.payload?.dc;

            // Critical/Fumble Checks
            if (result >= 20) {
                triggerAlert("CRITICAL THREAT DETECTED", "CRITICAL");
            } else if (result === 1) {
                triggerAlert("SYSTEM FAILURE (FUMBLE)", "CRITICAL");
            }

            // Resolution Check
            if (target) {
                if (result >= target) {
                    // Success
                    setMessage(`SUCCESS CHECK: ${result} >= ${target}`);
                    // Can we have a distinct SUCCESS state? Maybe use ANALYZING color but steady?
                    // For now reuse ANALYZING but with clear text
                    setStatus('ANALYZING');
                    setTimeout(() => setMessage(null), 3000); // Overlay timer
                } else {
                    // Fail
                    setMessage(`FAILURE CHECK: ${result} < ${target}`);
                    setStatus('CRITICAL'); // Red for fail?
                    setTimeout(() => { setMessage(null); setStatus('IDLE'); }, 3000);
                }
            }
        }

        // 3. ANALYSIS
        if (lastEvent.type === 'INFO' || lastEvent.type === 'LOOK') {
            triggerAlert("ANALYZING TARGET...", "ANALYZING");
        }

    }, [events]);

    const triggerAlert = (msg: string, type: 'CRITICAL' | 'ANALYZING' | 'COMBAT') => {
        setMessage(msg);
        const prev = status;
        setStatus(type);
        setTimeout(() => {
            setMessage(null);
            setStatus(prev === 'COMBAT' ? 'COMBAT' : 'IDLE');
        }, 3000);
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-[100]">
            {/* 1. Global Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

            {/* 2. HUD Corners */}
            <div className="absolute top-0 left-0 p-8">
                <div className="w-16 h-16 border-t-2 border-l-2 border-primary/50" />
            </div>
            <div className="absolute top-0 right-0 p-8">
                <div className="w-16 h-16 border-t-2 border-r-2 border-primary/50" />
            </div>
            <div className="absolute bottom-0 left-0 p-8">
                <div className="w-16 h-16 border-b-2 border-l-2 border-primary/50" />
                <div className="mt-2 text-[10px] font-mono text-primary/40 flex items-center gap-2">
                    <Activity className="w-3 h-3 animate-pulse" />
                    SYSTEM ONLINE
                </div>
            </div>
            <div className="absolute bottom-0 right-0 p-8 flex flex-col items-end">
                <div className="w-16 h-16 border-b-2 border-r-2 border-primary/50" />
                <div className="mt-2 text-[10px] font-mono text-primary/40 flex items-center gap-2">
                    C.O.R.T.E.X. v1.0
                    <Cpu className="w-3 h-3" />
                </div>
            </div>

            {/* 3. Central Status / Alerts */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        className={cn(
                            "absolute top-1/4 left-1/2 -translate-x-1/2 px-6 py-2 border-2 backdrop-blur-md flex items-center gap-4",
                            status === 'CRITICAL' ? "border-red-500 bg-red-900/40 text-red-500" :
                                status === 'ANALYZING' ? "border-cyan-500 bg-cyan-900/40 text-cyan-400" :
                                    "border-primary bg-black/50 text-primary"
                        )}
                    >
                        {status === 'CRITICAL' && <ShieldAlert className="w-6 h-6 animate-pulse" />}
                        {status === 'ANALYZING' && <Radio className="w-6 h-6 animate-spin-slow" />}

                        <div className="flex flex-col">
                            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-70">System Alert</span>
                            <span className="text-lg font-black tracking-wider uppercase glitch-text">{message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Combat Overlay (Red Vignette) */}
            <motion.div
                className="absolute inset-0 pointer-events-none box-border border-[10px] border-transparent"
                animate={{
                    boxShadow: status === 'COMBAT' ? "inset 0 0 100px rgba(220, 38, 38, 0.3)" : "inset 0 0 0px transparent"
                }}
                transition={{ duration: 1 }}
            />
        </div>
    );
}
