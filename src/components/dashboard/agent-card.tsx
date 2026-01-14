"use client";

import { motion } from "framer-motion";
import { User, Activity, Zap, Heart, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentCardProps {
    character: {
        id: string;
        name: string;
        class: string;
        level: number;
        avatarUrl?: string;
        hp: { current: number; max: number };
        pm: { current: number; max: number };
        attributes?: any; // Add attributes optional to fix lint error elsewhere
    };
    onSelect: () => void;
    className?: string;
}

export function AgentCard({ character, onSelect, className }: AgentCardProps) {
    const hpPct = (character.hp.current / character.hp.max) * 100;

    return (
        <motion.div
            layout // Enable layout animations
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={cn("group relative flex-shrink-0 w-64 h-80 bg-black/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer backdrop-blur-sm", className)}
            onClick={onSelect}
        >
            {/* Background Image / Avatar Fill */}
            <div className="absolute inset-0 z-0">
                {character.avatarUrl ? (
                    <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity grayscale group-hover:grayscale-0 duration-500" />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-800">
                        <User className="w-20 h-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

            {/* Floating Stats Label */}
            <div className="absolute top-3 right-3 z-30">
                <div className="px-2 py-0.5 rounded bg-black/60 border border-white/5 text-[10px] font-mono text-white/50 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                    NEX {character.level * 5}%
                </div>
            </div>

            {/* Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-4">
                <div className="transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                        {character.name}
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono mb-3 uppercase tracking-wider">
                        {character.class}
                    </p>

                    {/* Vitals Mini-Bar (Only shows on hover or if critical) */}
                    <div className="space-y-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                            <Activity className="w-3 h-3 text-red-500" />
                            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${hpPct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Ring */}
            <div className="absolute inset-0 border border-white/5 rounded-xl group-hover:border-primary/50 transition-colors z-30 pointer-events-none" />
        </motion.div>
    )
}
