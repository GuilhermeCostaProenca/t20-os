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

    // Simplified Grant Handler
    const handleGrant = (id: string, type: 'hp' | 'pm' | 'san', amount: number) => {
        // Optimistic Update (Real impl would call API)
        setAgents(prev => prev.map(a => {
            if (a.id !== id) return a;
            const key = type as keyof typeof a;
            // logic to update nested val... simplify for prototype:
            return a; // Placeholder
        }));
        console.log(`GRANT ${type.toUpperCase()} ${amount} to ${id}`);
    };

    return (
        <div className="flex items-start justify-center gap-2 p-2 w-full overflow-x-auto pointer-events-none">
            {agents.map(agent => {
                const hpPct = (agent.hp.current / agent.hp.max) * 100;
                const pmPct = (agent.pm.current / agent.pm.max) * 100;
                // Mock Sanity for now
                const sanCurrent = 50;
                const sanMax = 100;
                const sanPct = (sanCurrent / sanMax) * 100;

                const isDying = agent.hp.current <= 0;

                return (
                    <div
                        key={agent.id}
                        className={cn(
                            "pointer-events-auto group relative w-48 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden transition-all hover:scale-105 hover:border-primary/50 hover:bg-zinc-900 shadow-lg",
                            isDying && "border-red-500/50 animate-pulse bg-red-950/20"
                        )}
                        onClick={() => onSelect?.(agent.id)}
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
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex justify-between items-center h-4">
                                    <span className="text-xs font-bold truncate text-white/90">{agent.name}</span>
                                    {isDying && <Skull className="w-3 h-3 text-red-500" />}
                                </div>

                                {/* Bars Container */}
                                <div className="space-y-1 relative">
                                    {/* HP Bar */}
                                    <div className="group/bar relative h-2 w-full bg-black/50 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all", isDying ? "bg-red-600" : "bg-green-500")} style={{ width: `${hpPct}%` }} />
                                        {/* Hover Controls */}
                                        <div className="absolute inset-0 flex opacity-0 group-hover/bar:opacity-100 bg-black/60 items-center justify-center gap-4 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleGrant(agent.id, 'hp', -5) }} className="text-red-500 font-bold text-[10px] hover:scale-125">-</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleGrant(agent.id, 'hp', 5) }} className="text-green-500 font-bold text-[10px] hover:scale-125">+</button>
                                        </div>
                                    </div>

                                    {/* PM Bar */}
                                    <div className="group/bar relative h-2 w-full bg-black/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pmPct}%` }} />
                                        <div className="absolute inset-0 flex opacity-0 group-hover/bar:opacity-100 bg-black/60 items-center justify-center gap-4 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleGrant(agent.id, 'pm', -2) }} className="text-red-500 font-bold text-[10px] hover:scale-125">-</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleGrant(agent.id, 'pm', 2) }} className="text-blue-500 font-bold text-[10px] hover:scale-125">+</button>
                                        </div>
                                    </div>

                                    {/* Sanity Bar (New) */}
                                    <div className="group/bar relative h-1.5 w-full bg-black/50 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${sanPct}%` }} />
                                        <div className="absolute inset-0 flex opacity-0 group-hover/bar:opacity-100 bg-black/60 items-center justify-center gap-4 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleGrant(agent.id, 'san', -2) }} className="text-red-500 font-bold text-[10px] hover:scale-125">-</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleGrant(agent.id, 'san', 2) }} className="text-purple-500 font-bold text-[10px] hover:scale-125">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
