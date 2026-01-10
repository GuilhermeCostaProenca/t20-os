"use client";

import { X, Shield, Zap, Heart, Sword } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Unified Type for display
export type GrimoireItem = {
    type: 'CLASS' | 'RACE' | 'SPELL' | 'RULE';
    id: string;
    name: string;
    description?: string;
    data: any; // Raw data (CharacterClass, Race, etc)
};

interface GrimoireDetailViewProps {
    item: GrimoireItem | null;
    onClose: () => void;
}

export function GrimoireDetailView({ item, onClose }: GrimoireDetailViewProps) {
    if (!item) return null;

    return (
        <div className="fixed inset-y-4 right-4 w-[400px] bg-neutral-900/95 border border-white/10 shadow-2xl rounded-xl z-[90] flex flex-col animate-in slide-in-from-right-4 duration-300 backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-start bg-black/20">
                <div>
                    <Badge variant="outline" className="mb-2 text-[10px] tracking-widest uppercase opacity-70">
                        Arquivo • {item.type}
                    </Badge>
                    <h2 className="text-xl font-bold text-primary">{item.name}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {/* Description */}
                    {item.description && (
                        <div className="text-sm text-muted-foreground leading-relaxed italic">
                            {item.description}
                        </div>
                    )}

                    {/* Class Specifics */}
                    {item.type === 'CLASS' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded flex flex-col items-center gap-1">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    <div className="text-xs font-bold text-red-400">PV Inicial</div>
                                    <div className="text-lg font-mono">{item.data.hp.base} <span className="text-xs text-muted-foreground">+{item.data.hp.perLevel}/lvl</span></div>
                                </div>
                                <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded flex flex-col items-center gap-1">
                                    <Zap className="w-4 h-4 text-blue-500" />
                                    <div className="text-xs font-bold text-blue-400">PM Inicial</div>
                                    <div className="text-lg font-mono">{item.data.pm.base} <span className="text-xs text-muted-foreground">+{item.data.pm.perLevel}/lvl</span></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 border-b border-white/10 pb-1">Proficiências</h3>
                                <div className="flex flex-wrap gap-1">
                                    {item.data.proficiencies.length > 0 ? item.data.proficiencies.map((p: string) => (
                                        <Badge key={p} variant="secondary" className="text-xs bg-white/5 hover:bg-white/10 text-white/80">{p}</Badge>
                                    )) : <span className="text-xs text-muted-foreground">Nenhuma</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 border-b border-white/10 pb-1">Habilidades de Classe</h3>
                                <div className="p-3 bg-white/5 rounded border border-white/5 text-xs text-muted-foreground text-center">
                                    Dados de habilidades ainda não indexados completamente.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Race Specifics */}
                    {item.type === 'RACE' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 border-b border-white/10 pb-1">Modificadores de Atributo</h3>
                                <div className="grid grid-cols-3 gap-1">
                                    {Object.entries(item.data.attributes).map(([attr, val]: [string, any]) => (
                                        (val !== 0) && (
                                            <div key={attr} className="flex justify-between items-center px-2 py-1 bg-white/5 rounded">
                                                <span className="text-xs font-bold uppercase text-muted-foreground">{attr}</span>
                                                <span className={`text-xs font-mono font-bold ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {val > 0 ? '+' : ''}{val}
                                                </span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 border-b border-white/10 pb-1">Habilidades de Raça</h3>
                                <ul className="space-y-2">
                                    {item.data.abilities?.length > 0 ? item.data.abilities.map((a: any) => (
                                        <li key={a.name} className="p-2 bg-white/5 rounded border border-white/5">
                                            <div className="font-bold text-xs mb-1 text-primary">{a.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{a.description}</div>
                                        </li>
                                    )) : <span className="text-xs text-muted-foreground">Nenhuma habilidade registrada.</span>}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                <Button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50">
                    Utilizar Regra
                </Button>
            </div>
        </div>
    );
}
