"use client";

import { useEffect, useState } from "react";
import { Heart, Zap, Shield, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SquadMonitorProps {
    campaignId: string;
    onSelect?: (charId: string) => void;
}

type CharacterStatus = {
    id: string;
    name: string;
    avatarUrl?: string;
    hp: { current: number; max: number };
    pm: { current: number; max: number };
    def: number;
    conditions: string[];
};

export function SquadMonitor({ campaignId, onSelect }: SquadMonitorProps) {
    const [agents, setAgents] = useState<CharacterStatus[]>([]);
    const [loading, setLoading] = useState(true);

    // Poll for status updates
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Ideally this would be a specialized lightweight endpoint
                const res = await fetch(`/api/characters?campaignId=${campaignId}&withSheet=true`);
                const json = await res.json();
                if (json.data) {
                    const statusData = json.data.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        avatarUrl: c.avatarUrl,
                        hp: { current: c.sheet?.pvCurrent || 0, max: c.sheet?.pvMax || 1 },
                        pm: { current: c.sheet?.pmCurrent || 0, max: c.sheet?.pmMax || 1 },
                        def: c.sheet?.defenseFinal || 10,
                        conditions: [] // TODO: Real conditions
                    }));
                    setAgents(statusData);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // 5s poll
        return () => clearInterval(interval);
    }, [campaignId]);

    if (loading && agents.length === 0) {
        return (
            <div className="flex gap-2 p-2 justify-center w-full">
                {[1, 2, 3].map(i => <Skeleton key={i} className="w-32 h-14 bg-black/40 rounded" />)}
            </div>
        );
    }

    return (
        <div className="flex items-start justify-center gap-2 p-2 w-full overflow-x-auto pointer-events-none">
            {/* Pointer events auto only on cards so we can click through the empty space if needed, 
                but this is top bar so maybe not needed to be invisible. */}

            {agents.map(agent => {
                const hpPct = (agent.hp.current / agent.hp.max) * 100;
                const pmPct = (agent.pm.current / agent.pm.max) * 100;
                const isDying = agent.hp.current <= 0;

                return (
                    <div
                        key={agent.id}
                        onClick={() => onSelect?.(agent.id)}
                        className={cn(
                            "pointer-events-auto cursor-pointer group relative w-40 bg-black/60 backdrop-blur-md border border-white/10 rounded overflow-hidden transition-all hover:scale-105 hover:border-primary/50",
                            isDying && "border-red-500/50 animate-pulse bg-red-950/20"
                        )}
                    >
                        {/* Compact Layout */}
                        <div className="p-2 flex gap-3 items-center">
                            {/* Avatar */}
                            <div className={cn(
                                "w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0",
                                isDying && "border-red-500"
                            )}>
                                {agent.avatarUrl ? (
                                    <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-xs">{agent.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Vitals */}
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold truncate text-white/90">{agent.name}</span>
                                    {isDying && <Skull className="w-3 h-3 text-red-500" />}
                                </div>

                                {/* HP Bar */}
                                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all", isDying ? "bg-red-600" : "bg-green-500")}
                                        style={{ width: `${hpPct}%` }}
                                    />
                                </div>
                                {/* PM Bar */}
                                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all"
                                        style={{ width: `${pmPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hover Details overlay? Or keep it simple. */}
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-black/80 px-1 rounded text-white border border-white/20">
                                {agent.hp.current} / {agent.pm.current}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
