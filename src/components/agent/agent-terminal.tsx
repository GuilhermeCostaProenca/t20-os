"use client";

import { useState } from "react";
import { AttributeRadar } from "./attribute-radar";
import { Shield, Heart, Zap, Sword, Dna } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AgentTerminalProps {
    character: {
        name: string;
        class: string;
        level: number;
        attributes: any;
        hp: { current: number; max: number };
        pm: { current: number; max: number };
        def: number;
    };
    onRoll?: (expression: string, label: string) => void;
    compact?: boolean;
}

export function AgentTerminal({ character, onRoll, compact = false }: AgentTerminalProps) {
    // Mock Vitals Animation state
    const hpPercent = (character.hp.current / character.hp.max) * 100;
    const pmPercent = (character.pm.current / character.pm.max) * 100;

    return (
        <div className="w-full h-full bg-black/95 text-white overflow-hidden flex flex-col font-sans">
            {/* Header: Identity */}
            <header className={cn("border-b border-white/10 flex justify-between items-center bg-zinc-950/50", compact ? "p-3" : "p-4")}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-900/20 border border-red-500/50 flex items-center justify-center text-red-500 font-bold text-lg shrink-0">
                        {character.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold tracking-tight uppercase truncate">{character.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span className="text-red-400">LVL {character.level}</span>
                            <span>•</span>
                            <span className="uppercase truncate">{character.class}</span>
                        </div>
                    </div>
                </div>
                {!compact && (
                    <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mb-1">Status</div>
                        <div className="flex items-center gap-2 justify-end">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-green-500">ONLINE</span>
                        </div>
                    </div>
                )}
            </header>

            <main className={cn(
                "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
                compact ? "p-3 gap-4 grid-cols-1" : "p-6 gap-8 grid-cols-1 md:grid-cols-2"
            )}>
                {/* Left Column: Radar & Vitals */}
                <div className="flex flex-col gap-4 items-center justify-center relative">
                    {/* Background Tech Circles - Hidden in compact/sidebar mode to save performance/visual noise */}
                    {!compact && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <div className="w-[80%] aspect-square border border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="w-[60%] aspect-square border border-dashed border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                        </div>
                    )}

                    <div className={cn("z-10 w-full flex justify-center origin-center", compact ? "scale-75 -my-4" : "scale-90")}>
                        <AttributeRadar
                            attributes={character.attributes}
                            onAttributeClick={(attr) => onRoll?.(`1d20+${Math.floor((character.attributes[attr] - 10) / 2)}`, `Teste de ${attr.toUpperCase()}`)}
                        />
                    </div>

                    {/* Vitals Bars */}
                    <div className="w-full max-w-xs space-y-4 z-10">
                        {/* HP */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-2 text-red-500"><Heart className="w-3 h-3" /> PV</span>
                                <span>{character.hp.current} / {character.hp.max}</span>
                            </div>
                            <div className="h-1.5 w-full bg-red-950/30 rounded-full overflow-hidden border border-red-900/20">
                                <div
                                    className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500 ease-out"
                                    style={{ width: `${hpPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* PM */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-2 text-blue-500"><Zap className="w-3 h-3" /> PM</span>
                                <span>{character.pm.current} / {character.pm.max}</span>
                            </div>
                            <div className="h-1.5 w-full bg-blue-950/30 rounded-full overflow-hidden border border-blue-900/20">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-500 ease-out"
                                    style={{ width: `${pmPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Sanity */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-2 text-purple-500"><Dna className="w-3 h-3" /> Sanidade</span>
                                <span>50 / 100</span>
                            </div>
                            <div className="h-1.5 w-full bg-purple-950/30 rounded-full overflow-hidden border border-purple-900/20">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-500 ease-out"
                                    style={{ width: `50%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Loadout */}
                <div className="space-y-6">
                    {/* Defense Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="w-6 h-6 text-amber-500 opacity-80" />
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Defesa</div>
                                    <div className="text-xl font-bold font-mono leading-none">{character.def}</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sword className="w-6 h-6 text-purple-500 opacity-80" />
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Ataque</div>
                                    <div className="text-xl font-bold font-mono leading-none">+5</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="space-y-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            Protocolos
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                variant="outline"
                                className="h-12 justify-start bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 group px-3"
                                onClick={() => onRoll?.("1d20+5", "Ataque Corpo-a-Corpo")}
                            >
                                <Sword className="mr-3 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="text-left w-full overflow-hidden">
                                    <div className="font-bold text-sm truncate">Ataque Básico</div>
                                    <div className="text-[10px] opacity-50 font-mono truncate">1d8+3 Corte</div>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-12 justify-start bg-white/5 border-white/10 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400 group px-3"
                                onClick={() => onRoll?.("1d20+4", "Mísseis Mágicos")}
                            >
                                <Zap className="mr-3 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="text-left w-full overflow-hidden">
                                    <div className="font-bold text-sm truncate">Mísseis Mágicos</div>
                                    <div className="text-[10px] opacity-50 font-mono truncate">2d4+2 Essência</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
