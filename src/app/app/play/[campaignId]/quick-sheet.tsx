"use client";

import { useEffect, useState } from "react";
import { User, Shield, Heart, Zap, ChevronRight, ChevronLeft, Dna, Swords, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type CharacterSheet = {
    level: number;
    className?: string;
    ancestry?: string;
    for: number;
    des: number;
    con: number;
    int: number;
    sab: number;
    car: number;
    pvCurrent: number;
    pvMax: number;
    pmCurrent: number;
    pmMax: number;
    defenseFinal: number;
};

type Character = {
    id: string;
    name: string;
    avatarUrl?: string;
    sheet?: CharacterSheet;
};

interface QuickSheetProps {
    campaignId: string;
    onAction: (type: string, payload: any) => void;
    collapsed: boolean;
    onToggle: () => void;
}

export function QuickSheet({ campaignId, onAction, collapsed, onToggle }: QuickSheetProps) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [targetId, setTargetId] = useState<string>("none"); // "none" or uuid
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/characters?campaignId=${campaignId}&withSheet=true`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setCharacters(data.data);
                    if (data.data.length > 0) setSelectedId(data.data[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [campaignId]);

    const activeChar = characters.find(c => c.id === selectedId);

    // Mock Attacks if none (Standard T20)
    // In real app, we parse activeChar.sheet.attacks
    const attacks = [
        { name: "Desarmado", bonus: (activeChar?.sheet?.for ?? 10) - 10, damage: "1d3", crit: "20" },
        { name: "Espada Longa", bonus: ((activeChar?.sheet?.for ?? 10) - 10) + 2, damage: "1d8", crit: "19" }
    ];

    // Calc modifier: (Score - 10) / 2
    const getMod = (score: number) => Math.floor((score - 10) / 2);
    const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

    const attributes = [
        { label: "FOR", value: activeChar?.sheet?.for ?? 0, color: "bg-red-500/10 text-red-500 border-red-500/20" },
        { label: "DES", value: activeChar?.sheet?.des ?? 0, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
        { label: "CON", value: activeChar?.sheet?.con ?? 0, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
        { label: "INT", value: activeChar?.sheet?.int ?? 0, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
        { label: "SAB", value: activeChar?.sheet?.sab ?? 0, color: "bg-green-500/10 text-green-500 border-green-500/20" },
        { label: "CAR", value: activeChar?.sheet?.car ?? 0, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    ];

    if (collapsed) {
        return (
            <div className="w-[50px] border-r border-white/10 bg-black/20 flex flex-col items-center py-4 gap-4">
                <Button variant="ghost" size="icon" onClick={onToggle}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="h-px w-8 bg-white/10" />
                {activeChar && (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-xs font-bold text-primary">
                            {activeChar.name.charAt(0)}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-[300px] border-r border-white/10 bg-sidebar/50 flex flex-col relative animate-in slide-in-from-left-2 duration-300">
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-muted-foreground z-10"
                onClick={onToggle}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="p-4 border-b border-white/10 bg-black/20">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Ficha de Personagem</h3>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full bg-white/5" />
                        <Skeleton className="h-4 w-2/3 bg-white/5" />
                    </div>
                ) : characters.length === 0 ? (
                    <div className="text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <p className="text-xs text-muted-foreground">Nenhum personagem encontrado.</p>
                        <Button variant="link" className="h-auto p-0 text-xs text-primary">Criar Personagem</Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                            {activeChar?.avatarUrl ? (
                                <img src={activeChar.avatarUrl} alt={activeChar.name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-6 w-6 text-white/20" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            {/* Char Selector (Simplified as text for one char, or select if many) */}
                            {characters.length > 1 ? (
                                <select
                                    className="w-full bg-transparent text-sm font-bold text-foreground border-none p-0 focus:ring-0 cursor-pointer"
                                    value={selectedId || ""}
                                    onChange={(e) => setSelectedId(e.target.value)}
                                >
                                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            ) : (
                                <div className="text-sm font-bold truncate">{activeChar?.name}</div>
                            )}

                            <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                <span>Lv. {activeChar?.sheet?.level ?? 1}</span>
                                <span>•</span>
                                <span className="truncate">{activeChar?.sheet?.className ?? "Aventureiro"}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Target Selector */}
            <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center gap-2">
                <Crosshair className="h-3 w-3 text-red-400" />
                <span className="text-xs text-muted-foreground font-bold uppercase">Alvo:</span>
                <select
                    className="bg-transparent text-xs text-foreground border-none p-0 focus:ring-0 cursor-pointer flex-1"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                >
                    <option value="none" className="bg-neutral-900">Nenhum (Apenas Rolar)</option>
                    {characters.filter(c => c.id !== selectedId).map(c => (
                        <option key={c.id} value={c.id} className="bg-neutral-900">{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Vitals */}
            {activeChar?.sheet && (
                <div className="p-4 py-3 grid grid-cols-2 gap-3 bg-white/5 border-b border-white/10">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                            <span>PV</span>
                            <span>{activeChar.sheet.pvCurrent}/{activeChar.sheet.pvMax}</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${Math.min(100, (activeChar.sheet.pvCurrent / (activeChar.sheet.pvMax || 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                            <span>PM</span>
                            <span>{activeChar.sheet.pmCurrent}/{activeChar.sheet.pmMax}</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${Math.min(100, (activeChar.sheet.pmCurrent / (activeChar.sheet.pmMax || 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="col-span-2 flex justify-between items-center px-2 py-1 bg-black/20 rounded border border-white/5 mt-1">
                        <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Defesa</span>
                        </div>
                        <span className="font-bold font-mono">{activeChar.sheet.defenseFinal}</span>
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1 px-4">
                <div className="space-y-6 py-4">

                    {/* Attacks Section */}
                    {activeChar && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Swords className="h-3 w-3" />
                                Ataques
                            </div>
                            <div className="space-y-1">
                                {attacks.map((atk, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full justify-between h-9 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 group"
                                        onClick={() => onAction('ATTACK', {
                                            attackerId: activeChar?.id,
                                            targetId: targetId === 'none' ? undefined : targetId,
                                            attackName: atk.name,
                                            attackBonus: atk.bonus,
                                            damageExpression: atk.damage
                                        })}
                                    >
                                        <span className="font-bold text-xs">{atk.name}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-red-400/80">
                                            <span>{atk.bonus >= 0 ? `+${atk.bonus}` : atk.bonus}</span>
                                            <div className="w-px h-3 bg-white/20" />
                                            <span>{atk.damage}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attributes */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Dna className="h-3 w-3" />
                            Atributos
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {attributes.map(attr => {
                                const mod = getMod(attr.value);
                                return (
                                    <button
                                        key={attr.label}
                                        onClick={() => onAction('ROLL_DICE', { expression: `1d20${mod >= 0 ? '+' : ''}${mod}`, label: `Teste de ${attr.label}` })}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded border transition-all hover:bg-opacity-20 active:scale-95",
                                            attr.color
                                        )}
                                    >
                                        <div className="flex flex-col items-start leading-none gap-1">
                                            <span className="text-[10px] font-bold opacity-70">{attr.label}</span>
                                            <span className="text-xs font-mono opacity-50">{attr.value}</span>
                                        </div>
                                        <span className="text-lg font-bold">{formatMod(mod)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Rolls (Initiative, Ref, Fort, Will) */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            Resistências
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => onAction('ROLL_DICE', { expression: "1d20", label: "Fortitude" })}>FORT</Button>
                            <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => onAction('ROLL_DICE', { expression: "1d20", label: "Reflexos" })}>REF</Button>
                            <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => onAction('ROLL_DICE', { expression: "1d20", label: "Vontade" })}>VON</Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed border-primary/30 text-primary hover:bg-primary/10" onClick={() => onAction('ROLL_DICE', { expression: "1d20", label: "Iniciativa" })}>
                            Rolar Iniciativa
                        </Button>
                    </div>

                </div>
            </ScrollArea>
        </div>
    );
}
