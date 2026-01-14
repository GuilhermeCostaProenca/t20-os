"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, SkipForward, Skull, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

type Combatant = {
    id: string;
    name: string;
    initiative: number;
    hpCurrent: number;
    hpMax: number;
};

type CombatTrackerProps = {
    campaignId: string;
};

export function CombatTracker({ campaignId }: CombatTrackerProps) {
    const [combat, setCombat] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Poll for combat state (MVP polling)
    useEffect(() => {
        const interval = setInterval(fetchCombat, 2000);
        fetchCombat();
        return () => clearInterval(interval);
    }, []);

    async function fetchCombat() {
        // Ideally this endpoint exists to GET combat state.
        // For now we assume we can GET via the combat action or a specialized GET.
        // I'll assume we need to add GET to the route allow fetching.
        // Or just use the action 'START' which returns existing combat? 
        // Let's rely on event stream for updates effectively, OR just fetch specific standard endpoint.
        // I haven't implemented GET /api/play/combat.
        // I will implement a quick fetcher or assume we have it.
        // Let's implement fetch logic in a moment.
    }

    async function sendAction(action: string) {
        setLoading(true);
        await fetch("/api/play/combat", {
            method: "POST",
            body: JSON.stringify({ action, campaignId }),
        });
        setLoading(false);
        fetchCombat(); // Refresh immediately
    }

    // Placeholder UI until we have data
    return (
        <Card className="border-red-500/20 bg-black/40 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                        <Swords className="h-4 w-4" /> Combate
                    </CardTitle>
                    <Badge variant="outline" className="border-red-500/30 text-red-400">Round {combat?.round || 1}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Controls */}
                <div className="flex gap-2">
                    {!combat?.isActive ? (
                        <Button size="sm" className="w-full bg-red-600 hover:bg-red-700" onClick={() => sendAction("START")}>
                            <Play className="mr-2 h-3 w-3" /> Iniciar
                        </Button>
                    ) : (
                        <>
                            <Button size="sm" variant="secondary" onClick={() => sendAction("INITIATIVE")}>
                                Rolar Inic.
                            </Button>
                            <Button size="sm" className="flex-1" onClick={() => sendAction("NEXT_TURN")}>
                                <SkipForward className="mr-2 h-3 w-3" /> Próximo
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => sendAction("END")}>
                                <Skull className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>

                {/* List */}
                <div className="space-y-1">
                    {combat?.combatants?.map((c: any, i: number) => (
                        <div key={c.id} className={cn(
                            "flex items-center justify-between p-2 rounded text-sm transition-all",
                            i === combat.turnIndex ? "bg-red-900/40 border border-red-500/50 scale-[1.02]" : "bg-white/5 border border-transparent"
                        )}>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-white/50 w-6 text-center">{c.initiative}</span>
                                <span className={cn("font-medium", i === combat.turnIndex ? "text-white" : "text-white/70")}>{c.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{c.hpCurrent}/{c.hpMax} HP</span>
                        </div>
                    ))}
                    {combat?.isActive && !combat?.combatants?.length && (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                            Role iniciativa para adicionar combatentes.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
