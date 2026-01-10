"use client";

import { useState } from "react";
import { Check, ChevronRight, Dna, Shield, Sword, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { TORMENTA20_RACES } from "@/rulesets/tormenta20/races";
import { TORMENTA20_CLASSES } from "@/rulesets/tormenta20/classes";
import { Race, CharacterClass } from "@/rulesets/base/types";

// --- T20 Constants (Grimoire Powered) ---
const RACES = TORMENTA20_RACES.map(r => ({
    id: r.id,
    name: r.name,
    // Map PT-BR keys (for, des) to EN keys (str, dex) used in this component state
    mods: {
        str: r.attributes.for || 0,
        dex: r.attributes.des || 0,
        con: r.attributes.con || 0,
        int: r.attributes.int || 0,
        wis: r.attributes.sab || 0,
        cha: r.attributes.car || 0,
    },
    description: r.abilities.map(a => a.name).join(", "), // Summary of abilities
    fullAbilities: r.abilities
}));

const CLASSES = TORMENTA20_CLASSES;

const ATTRIBUTES = [
    { id: "str", name: "Força" },
    { id: "dex", name: "Destreza" },
    { id: "con", name: "Constituição" },
    { id: "int", name: "Inteligência" },
    { id: "wis", name: "Sabedoria" },
    { id: "cha", name: "Carisma" },
];

interface CharacterWizardProps {
    campaigns: { id: string; name: string }[];
    onComplete: (data: any) => void;
    onCancel: () => void;
}

export function CharacterWizard({ campaigns, onComplete, onCancel }: CharacterWizardProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || "");
    const [selectedRace, setSelectedRace] = useState<any>(RACES[0]);
    const [selectedClass, setSelectedClass] = useState<CharacterClass>(CLASSES[0]);

    // Attributes (Base 10 + Point Buy + Race Mods)
    // Simplified: Just direct input or simple +/- for now? 
    // Let's do Standard Array or Point Buy.
    // MVP: Base 10 + Race Mods + Manual Adjust (Standard T20 is rolled or point buy).
    // Let's assume defaults 10 for all + Race Mods for simplicity.
    const [attributes, setAttributes] = useState({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });

    const currentMods = selectedRace.mods || {};

    const totalStats = {
        str: attributes.str + (currentMods.str || 0),
        dex: attributes.dex + (currentMods.dex || 0),
        con: attributes.con + (currentMods.con || 0),
        int: attributes.int + (currentMods.int || 0),
        wis: attributes.wis + (currentMods.wis || 0),
        cha: attributes.cha + (currentMods.cha || 0),
    };

    function handleNext() {
        if (step < 4) setStep(step + 1);
        else handleFinish();
    }

    function handleFinish() {
        // Calculate derived stats
        const finalHp = selectedClass.hp.base + Math.floor((totalStats.con - 10) / 2);
        const finalPm = selectedClass.pm.base; // Simplified

        const data = {
            campaignId: selectedCampaignId,
            name,
            ancestry: selectedRace.name,
            className: selectedClass.name,
            attributes: totalStats,
            stats: {
                hp: { current: finalHp, max: finalHp },
                pm: { current: finalPm, max: finalPm },
            },
            level: 1,
            skills: {}, // TODO
        };
        onComplete(data);
    }

    return (
        <Card className="w-full max-w-2xl mx-auto border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Criar Personagem (Nível 1)
                    <span className="text-xs uppercase tracking-widest text-muted-foreground opacity-50">Passo {step}/4</span>
                </CardTitle>
                <CardDescription>Defina a lenda que você se tornará.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome do Herói</Label>
                                <Input placeholder="Ex: Valeros" value={name} onChange={e => setName(e.target.value)} autoFocus />
                            </div>
                            <div className="space-y-2">
                                <Label>Campanha</Label>
                                <select
                                    className="h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 text-sm"
                                    value={selectedCampaignId}
                                    onChange={e => setSelectedCampaignId(e.target.value)}
                                >
                                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Ancestralidade (Raça)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {RACES.map(r => (
                                    <div key={r.id}
                                        onClick={() => setSelectedRace(r)}
                                        className={cn(
                                            "cursor-pointer p-3 rounded-lg border text-sm transition-all",
                                            selectedRace.id === r.id ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="font-bold flex items-center justify-between">
                                            {r.name}
                                            {selectedRace.id === r.id && <Check className="w-3 h-3 text-primary" />}
                                        </div>
                                        <p className="opacity-60 text-xs mt-1 truncate">{r.description}</p>
                                        <div className="flex gap-1 mt-2 text-[10px] opacity-80 font-mono flex-wrap">
                                            {Object.entries(r.mods).map(([k, v]) => (
                                                <span key={k} className={Number(v) > 0 ? "text-green-400" : "text-red-400"}>
                                                    {k.toUpperCase()} {Number(v) > 0 ? '+' : ''}{v as number}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <Label>Classe</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {CLASSES.map(c => (
                                <div key={c.id}
                                    onClick={() => setSelectedClass(c)}
                                    className={cn(
                                        "cursor-pointer p-4 rounded-lg border text-sm transition-all flex items-center gap-4",
                                        selectedClass.id === c.id ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className="p-2 bg-black/40 rounded-full">
                                        {c.id === 'guerreiro' ? <Sword className="w-5 h-5 text-red-500" /> :
                                            c.id === 'arcanista' ? <Sparkles className="w-5 h-5 text-blue-500" /> :
                                                <Shield className="w-5 h-5 text-amber-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-lg">{c.name}</div>
                                        <p className="opacity-60">{c.description}</p>
                                    </div>
                                    <div className="text-right text-xs opacity-70 font-mono">
                                        <div>PV: {c.hp.base}+{c.hp.perLevel}/lvl</div>
                                        <div>PM: {c.pm.base}+{c.pm.perLevel}/lvl</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center justify-between">
                            <Label>Atributos</Label>
                            <div className="text-xs text-muted-foreground">Distribua seus pontos (Simulado)</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {ATTRIBUTES.map(attr => {
                                const base = attributes[attr.id as keyof typeof attributes];
                                const mod = (currentMods as any)[attr.id] || 0;
                                const total = base + mod;
                                const modifier = Math.floor((total - 10) / 2);

                                return (
                                    <div key={attr.id} className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center">
                                        <span className="text-xs uppercase font-bold opacity-50 mb-1">{attr.name}</span>
                                        <div className="text-2xl font-bold font-mono text-primary">{total}</div>
                                        <div className="text-xs opacity-70 mb-2">Mod: {modifier >= 0 ? '+' : ''}{modifier}</div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-6 w-6"
                                                onClick={() => setAttributes(p => ({ ...p, [attr.id]: Math.max(8, base - 1) }))}
                                            >-</Button>
                                            <span className="text-sm font-bold w-4 text-center">{base}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6"
                                                onClick={() => setAttributes(p => ({ ...p, [attr.id]: Math.min(18, base + 1) }))}
                                            >+</Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
                        <Sparkles className="w-12 h-12 text-primary mx-auto opacity-50 animate-pulse" />
                        <h3 className="text-lg font-bold">Personagem Pronto!</h3>
                        <p className="opacity-60 max-w-sm mx-auto">
                            {name} será um {selectedRace.name} {selectedClass.name} com {totalStats.str} de Força e {totalStats.int} de Inteligência.
                        </p>
                        <div className="bg-white/5 p-4 rounded-lg inline-block text-left text-sm font-mono border border-white/10">
                            <div>PV (Vida): {selectedClass.hp.base + Math.floor(((totalStats.con || 10) - 10) / 2)}</div>
                            <div>PM (Mana): {selectedClass.pm.base}</div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-4 border-t border-white/10">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={() => setStep(step - 1)}>Voltar</Button>
                    ) : (
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                    )}

                    <Button onClick={handleNext} className="gap-2">
                        {step === 4 ? "Criar Lenda" : "Próximo"}
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
