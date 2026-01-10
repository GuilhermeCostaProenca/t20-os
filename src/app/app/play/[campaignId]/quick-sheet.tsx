"use client";

import { useEffect, useState } from "react";
import { User, Shield, Heart, Zap, ChevronRight, ChevronLeft, Dna, Swords, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AgentTerminal } from "@/components/agent/agent-terminal";

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

    if (collapsed) {
        return (
            <div className="w-[50px] border-r border-white/10 bg-black/20 flex flex-col items-center py-4 gap-4 z-40 relative">
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

    // Map Character to AgentTerminal Props
    const terminalChar = activeChar ? {
        name: activeChar.name,
        class: activeChar.sheet?.className || "Agente",
        level: activeChar.sheet?.level || 1,
        attributes: {
            for: activeChar.sheet?.for || 10,
            des: activeChar.sheet?.des || 10,
            con: activeChar.sheet?.con || 10,
            int: activeChar.sheet?.int || 10,
            sab: activeChar.sheet?.sab || 10,
            car: activeChar.sheet?.car || 10,
        },
        hp: { current: activeChar.sheet?.pvCurrent || 0, max: activeChar.sheet?.pvMax || 1 },
        pm: { current: activeChar.sheet?.pmCurrent || 0, max: activeChar.sheet?.pmMax || 1 },
        def: activeChar.sheet?.defenseFinal || 10
    } : null;

    return (
        <div className="w-[450px] border-r border-white/10 bg-sidebar/95 backdrop-blur-md flex flex-col relative animate-in slide-in-from-left-2 duration-300 z-40 shadow-2xl">
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-muted-foreground z-50 hover:bg-white/10 hover:text-white"
                onClick={onToggle}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {!activeChar ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
                    <Dna className="w-12 h-12 mb-4 animate-pulse" />
                    <p>Nenhum agente selecionado.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden relative">
                    {/* Character Selector Overlay (Top Left) */}
                    <div className="absolute top-4 left-4 z-50">
                        {characters.length > 1 && (
                            <select
                                className="bg-black/50 border border-white/10 text-xs text-white rounded p-1"
                                value={selectedId || ""}
                                onChange={(e) => setSelectedId(e.target.value)}
                            >
                                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* The Terminal */}
                    {terminalChar && (
                        <AgentTerminal
                            character={terminalChar}
                            onRoll={(expr, label) => onAction('ROLL_DICE', { expression: expr, label })}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
