"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Ordem Paranormal Attributes: AGI, FOR, INT, PRE, VIG
function Pentagram({ attributes, onRoll }: { attributes: any, onRoll?: (attr: string, val: number) => void }) {
    // Map internal T20 keys (if used) to OP keys or expect proper keys
    // Expected keys: agi, for, int, pre, vig
    // Fallback mapping: des->agi, for->for, int->int, car->pre, con->vig
    const attrs = {
        agi: attributes.agi ?? attributes.dex ?? attributes.des ?? 1,
        for: attributes.for ?? attributes.str ?? 1,
        int: attributes.int ?? 1,
        pre: attributes.pre ?? attributes.cha ?? attributes.car ?? 1,
        vig: attributes.vig ?? attributes.con ?? 1,
    };

    return (
        <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center select-none">
            {/* Pentagram SVG Background */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-zinc-800 pointer-events-none">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <path d="M50 5 L80 90 L10 40 L90 40 L20 90 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>

            {/* Agilidade (Top) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => onRoll?.("Agilidade", attrs.agi)}>
                <div className="w-10 h-10 rounded-full border-2 border-yellow-500 bg-black flex items-center justify-center text-xl font-bold text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    {attrs.agi}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">AGI</span>
            </div>

            {/* Presença (Right) */}
            <div className="absolute top-[35%] right-2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => onRoll?.("Presença", attrs.pre)}>
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 bg-black flex items-center justify-center text-xl font-bold text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    {attrs.pre}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">PRE</span>
            </div>

            {/* Vigor (Bottom Right) */}
            <div className="absolute bottom-4 right-10 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => onRoll?.("Vigor", attrs.vig)}>
                <div className="w-10 h-10 rounded-full border-2 border-red-500 bg-black flex items-center justify-center text-xl font-bold text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {attrs.vig}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">VIG</span>
            </div>

            {/* Força (Bottom Left) */}
            <div className="absolute bottom-4 left-10 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => onRoll?.("Força", attrs.for)}>
                <div className="w-10 h-10 rounded-full border-2 border-orange-500 bg-black flex items-center justify-center text-xl font-bold text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                    {attrs.for}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">FOR</span>
            </div>

            {/* Intelecto (Left) */}
            <div className="absolute top-[35%] left-2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform" onClick={() => onRoll?.("Intelecto", attrs.int)}>
                <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-black flex items-center justify-center text-xl font-bold text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    {attrs.int}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">INT</span>
            </div>
        </div>
    );
}

const SKILL_LIST = [
    { name: "Acrobacia", attr: "agi" },
    { name: "Adestramento", attr: "pre" },
    { name: "Artes", attr: "pre" },
    { name: "Atletismo", attr: "for" },
    { name: "Atualidades", attr: "int" },
    { name: "Ciências", attr: "int" },
    { name: "Crime", attr: "agi" },
    { name: "Diplomacia", attr: "pre" },
    { name: "Enganação", attr: "pre" },
    { name: "Fortitude", attr: "vig" },
    { name: "Furtividade", attr: "agi" },
    { name: "Iniciativa", attr: "agi" },
    { name: "Intimidação", attr: "pre" },
    { name: "Intuição", attr: "pre" },
    { name: "Investigação", attr: "int" },
    { name: "Luta", attr: "for" },
    { name: "Medicina", attr: "int" },
    { name: "Ocultismo", attr: "int" },
    { name: "Percepção", attr: "pre" },
    { name: "Pilotagem", attr: "agi" },
    { name: "Pontaria", attr: "agi" },
    { name: "Profissão", attr: "int" },
    { name: "Reflexos", attr: "agi" },
    { name: "Religião", attr: "pre" },
    { name: "Sobrevivência", attr: "int" },
    { name: "Tática", attr: "int" },
    { name: "Tecnologia", attr: "int" },
    { name: "Vontade", attr: "pre" },
];

// ... imports
import { useState } from "react";
// ... Pentagram function



export function OrdemSheet({ character, onRoll }: { character: any, onRoll?: (expr: string, label: string) => void }) {
    const [tab, setTab] = useState<'skills' | 'inventory'>('skills');

    // Derived Stats
    const nex = character.level * 5;
    const peRodada = character.level; // simplified
    const def = character.stats?.def || 10;

    // Mock Inventory until DB structure is firm
    const inventory = character.inventory || [
        { name: "Pistola Tática", type: "Arma", weight: 1, damage: "1d12", crit: "19/x2" },
        { name: "Colete Leve", type: "Proteção", weight: 2, def: 2 },
        { name: "Kit de Perícia", type: "Equip", weight: 1 },
        { name: "Munição Leve", type: "Munição", weight: 1, qtd: 2 },
    ];

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-sans">
            {/* Header / Top Stats */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {/* ... (Keep existing stats header) */}
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">NEX</div>
                    <div className="text-xl font-bold text-white">{nex}%</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Desloc</div>
                    <div className="text-xl font-bold text-white">9m</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Defesa</div>
                    <div className="text-xl font-bold text-white">{def}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">PE/Rodada</div>
                    <div className="text-xl font-bold text-white">{peRodada}</div>
                </div>
            </div>

            {/* Vitals */}
            <div className="space-y-4 mb-8">
                {/* ... (Keep existing vital bars) */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-red-500">Vida (PV)</span>
                        <span>{character.hp.current} / {character.hp.max}</span>
                    </div>
                    <div className="h-2 bg-red-950 rounded-full overflow-hidden border border-red-900/50">
                        <div style={{ width: `${(character.hp.current / character.hp.max) * 100}%` }} className="h-full bg-red-600" />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-purple-500">Sanidade (SAN)</span>
                        <span>{character.hp.current} / {character.hp.max}</span>
                    </div>
                    <div className="h-2 bg-purple-950 rounded-full overflow-hidden border border-purple-900/50">
                        <div style={{ width: `80%` }} className="h-full bg-purple-600" />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-yellow-500">Esforço (PE)</span>
                        <span>{character.pm.current} / {character.pm.max}</span>
                    </div>
                    <div className="h-2 bg-yellow-950 rounded-full overflow-hidden border border-yellow-900/50">
                        <div style={{ width: `${(character.pm.current / character.pm.max) * 100}%` }} className="h-full bg-yellow-600" />
                    </div>
                </div>
            </div>

            <Separator className="bg-zinc-800 mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Attributes */}
                <div>
                    <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-widest text-center">Atributos</h3>
                    <Pentagram
                        attributes={character.attributes}
                        onRoll={(attr, val) => onRoll?.(`1d20+${val}`, `Teste de ${attr}`)}
                    />
                </div>

                {/* Right: Skills & Inventory Tabs */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center gap-4 mb-4 border-b border-zinc-800 pb-2">
                        <button
                            onClick={() => setTab('skills')}
                            className={cn("text-xs font-bold uppercase tracking-widest transition-colors hover:text-white", tab === 'skills' ? "text-white border-b border-white pb-2 -mb-2.5" : "text-zinc-600")}
                        >
                            Perícias
                        </button>
                        <button
                            onClick={() => setTab('inventory')}
                            className={cn("text-xs font-bold uppercase tracking-widest transition-colors hover:text-white", tab === 'inventory' ? "text-white border-b border-white pb-2 -mb-2.5" : "text-zinc-600")}
                        >
                            Inventário
                        </button>
                    </div>

                    <ScrollArea className="h-[300px] border border-zinc-800 rounded bg-zinc-900/30 p-2">
                        {tab === 'skills' ? (
                            <div className="space-y-1">
                                {SKILL_LIST.map(skill => {
                                    const val = character.attributes?.[skill.attr] || character.attributes?.[skill.attr === 'agi' ? 'dex' : skill.attr === 'pre' ? 'cha' : skill.attr === 'vig' ? 'con' : skill.attr] || 0;
                                    const trained = character.skills?.[skill.name.toLowerCase()]?.trained ? 5 : 0;
                                    const total = val + trained;

                                    return (
                                        <div key={skill.name} className="flex justify-between items-center px-2 py-1.5 hover:bg-zinc-800 rounded cursor-pointer group" onClick={() => onRoll?.(`1d20+${total}`, `Teste de ${skill.name}`)}>
                                            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{skill.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-zinc-600 uppercase">{skill.attr}</span>
                                                <span className="font-bold text-sm text-zinc-400 group-hover:text-white w-6 text-right">+{total}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {inventory.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center px-2 py-2 border-b border-white/5 last:border-0 hover:bg-zinc-800/50 rounded cursor-pointer group">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-white">{item.name}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase">{item.type} {item.dmg && `• ${item.dmg}`}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.qtd && <Badge variant="secondary" className="text-[10px] h-5 bg-white/10">x{item.qtd}</Badge>}
                                            <span className="text-xs text-zinc-600 font-mono">{item.weight}kg</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-4 p-4 border border-dashed border-zinc-800 rounded text-center text-xs text-zinc-600 uppercase tracking-widest cursor-pointer hover:border-zinc-600 hover:text-zinc-400">
                                    + Adicionar Item
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
