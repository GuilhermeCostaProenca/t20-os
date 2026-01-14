"use client";

import { motion } from "framer-motion";
import { Skull, Shield, Sword, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NpcCardProps {
    npc: {
        id: string;
        name: string;
        type: "npc" | "enemy";
        hpMax: number;
        defenseFinal: number;
        damageFormula?: string;
        imageUrl?: string;
        description?: string;
    };
    onSelect?: () => void;
    onAddToCombat?: () => void;
    className?: string;
}

export function NpcCard({ npc, onSelect, onAddToCombat, className }: NpcCardProps) {
    const isEnemy = npc.type === "enemy";

    return (
        <motion.div
            layout
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={cn(
                "group relative flex-shrink-0 w-full h-48 bg-black/40 border rounded-xl overflow-hidden cursor-pointer backdrop-blur-sm transition-colors",
                isEnemy ? "border-red-500/10 hover:border-red-500/40" : "border-white/10 hover:border-blue-500/40",
                className
            )}
            onClick={onSelect}
        >
            {/* Background Image / Fill */}
            <div className="absolute inset-0 z-0">
                {npc.imageUrl ? (
                    <img src={npc.imageUrl} alt={npc.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity grayscale group-hover:grayscale-0 duration-500" />
                ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", isEnemy ? "bg-red-950/20" : "bg-blue-950/20")}>
                        {isEnemy ? <Skull className="w-16 h-16 text-red-900/50" /> : <User className="w-16 h-16 text-blue-900/50" />}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest border-opacity-30", isEnemy ? "text-red-400 border-red-500 bg-red-950/30" : "text-blue-400 border-blue-500 bg-blue-950/30")}>
                        {isEnemy ? "AMEAÇA" : "ALIADO"}
                    </Badge>
                </div>

                <div className="space-y-1 transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {npc.name}
                    </h4>

                    {/* Stats Grid */}
                    <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1" title="Vida Máxima">
                            <Shield className="w-3 h-3 text-green-500" />
                            <span>{npc.hpMax} PV</span>
                        </div>
                        <div className="flex items-center gap-1" title="Defesa">
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span>{npc.defenseFinal} DEF</span>
                        </div>
                        <div className="flex items-center gap-1" title="Dano Médio">
                            <Sword className="w-3 h-3 text-red-500" />
                            <span>{npc.damageFormula}</span>
                        </div>
                    </div>

                    {npc.description && (
                        <p className="text-[10px] text-zinc-500 line-clamp-2 mt-2 max-w-[80%] hidden group-hover:block animate-in fade-in slide-in-from-bottom-1">
                            {npc.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Actions (Hover Only) */}
            {onAddToCombat && (
                <div className="absolute bottom-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCombat(); }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded uppercase font-bold tracking-wider shadow-lg shadow-red-900/20"
                    >
                        Combater
                    </button>
                </div>
            )}
        </motion.div>
    )
}
