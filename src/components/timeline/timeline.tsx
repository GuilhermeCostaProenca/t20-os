
import { TimelineGroup, TimelineEvent } from "@/lib/timeline/grouper";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sword, Scroll, Dice5, MessageSquare, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// --- Components ---

function getIcon(type: string) {
    if (type.includes('COMBAT')) return <Sword className="w-4 h-4 text-red-400" />;
    if (type.includes('ROLL')) return <Dice5 className="w-4 h-4 text-blue-400" />;
    if (type.includes('NOTE')) return <Scroll className="w-4 h-4 text-amber-400" />;
    if (type.includes('CHAT')) return <MessageSquare className="w-4 h-4 text-zinc-400" />;
    if (type.includes('TURN')) return <Clock className="w-4 h-4 text-purple-400" />;
    if (type.includes('ATTACK')) return <ShieldAlert className="w-4 h-4 text-orange-400" />;
    return <div className="w-2 h-2 rounded-full bg-white/20" />;
}

import { Pin } from "lucide-react";

function TimelineItem({ event, isLast, isPinned, onPin }: { event: TimelineEvent, isLast: boolean, isPinned?: boolean, onPin?: (id: string) => void }) {
    // Render Detail based on type
    const isRoll = event.type === 'ROLL' || event.type === 'ATTACK' || event.type === 'INITIATIVE';

    return (
        <div className={cn("flex gap-4 group relative pb-6 last:pb-0", isPinned && "bg-amber-500/5 -mx-2 px-2 rounded-lg border border-amber-500/20")}>
            {/* Connector Line */}
            {!isLast && (
                <div className="absolute left-[19px] top-8 bottom-0 w-px bg-white/5 group-hover:bg-white/10 transition-colors" />
            )}

            {/* Icon Node */}
            <div className={cn(
                "relative z-10 w-10 h-10 shrink-0 rounded-full border flex items-center justify-center shadow-sm transition-all",
                isPinned
                    ? "border-amber-500 bg-amber-900/40 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : "border-white/10 bg-black/40 group-hover:border-primary/30 group-hover:bg-primary/5"
            )}>
                {getIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1 min-w-0 relative">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-foreground/90 truncate">
                        {event.actorName || event.payload?.author || "Sistema"}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                            {format(new Date(event.ts), 'HH:mm')}
                        </span>
                        {onPin && (
                            <button
                                onClick={() => onPin(event.id)}
                                className={cn(
                                    "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded",
                                    isPinned && "opacity-100 text-amber-500"
                                )}
                                title={isPinned ? "Remover Evidência" : "Marcar como Evidência"}
                            >
                                <Pin className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {isRoll ? (
                    <div className="flex items-center gap-2 mt-1 bg-black/20 p-2 rounded border border-white/5">
                        <div className="font-bold text-primary">{event.payload?.roll?.result ?? event.payload?.total}</div>
                        <div className="text-xs text-muted-foreground truncate">{event.payload?.roll?.expression ?? event.payload?.expression ?? "Rolagem"}</div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {event.payload?.text ?? event.payload?.message ?? JSON.stringify(event.payload)}
                    </p>
                )}
            </div>
        </div>
    );
}

function GroupHeader({ group }: { group: TimelineGroup }) {
    const isCombat = group.type === 'CombatRound';
    return (
        <div className="sticky top-0 z-20 flex items-center gap-3 py-2 bg-background/95 backdrop-blur border-b border-white/5 mb-4">
            <div className={cn("w-2 h-2 rounded-full", isCombat ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500")} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.title}
            </h3>
            <span className="ml-auto text-[10px] opacity-40">
                {format(group.startTime, "HH:mm")}
            </span>
        </div>
    );
}

export function Timeline({ groups, pinnedIds = new Set(), onPin }: { groups: TimelineGroup[], pinnedIds?: Set<string>, onPin?: (id: string) => void }) {
    return (
        <div className="flex flex-col px-4 pb-10">
            {groups.map((group) => (
                <div key={group.id} className="mb-8 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GroupHeader group={group} />
                    <div className="flex flex-col">
                        {group.events.map((event, idx) => (
                            <TimelineItem
                                key={event.id}
                                event={event}
                                isLast={idx === group.events.length - 1}
                                isPinned={pinnedIds.has(event.id)}
                                onPin={onPin}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {groups.length === 0 && (
                <div className="text-center py-20 opacity-30 text-sm">
                    A história começa agora...
                </div>
            )}
        </div>
    );
}
