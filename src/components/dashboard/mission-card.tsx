"use client";

import { motion } from "framer-motion";
import { Play, Users, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MissionCardProps {
    id: string;
    title: string;
    description: string;
    system: string;
    lastPlayed?: string;
    playerCount: number;
    level: number;
    imageUrl?: string;
    onPlay: () => void;
}

export function MissionCard({ title, description, system, lastPlayed, playerCount, level, imageUrl, onPlay }: MissionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="group relative w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onPlay}
        >
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 transition-opacity group-hover:opacity-80" />
            </div>

            {/* Glowing Border FX on Hover */}
            <div className="absolute inset-0 border-2 border-primary/0 rounded-2xl transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] z-10 pointer-events-none" />

            {/* Content */}
            <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                {/* Top Badge */}
                <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Operação Ativa</span>
                    </div>
                </div>

                {/* Main Info */}
                <div className="space-y-1 transform transition-transform duration-300 group-hover:-translate-y-2">
                    <div className="flex items-center gap-2 text-primary text-xs font-mono mb-1 opacity-80">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{system} • NÍVEL {level}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none uppercase brand-font glow-text">
                        {title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 max-w-[90%] font-light">
                        {description}
                    </p>
                </div>

                {/* Footer / Meta */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{playerCount} Agentes</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{lastPlayed || "Iniciando..."}</span>
                        </div>
                    </div>

                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]">
                        <Play className="w-3 h-3 mr-2" />
                        INICIAR
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
