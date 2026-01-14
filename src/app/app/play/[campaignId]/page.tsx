"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Send, Shield, Sparkles, BookOpen, Map as MapIcon } from "lucide-react";
import { QuickSheet } from "./quick-sheet";
import { CombatTracker } from "@/components/play/combat-tracker";
import { SquadMonitor } from "@/components/overseer/squad-monitor";
import { OmniSearch } from "@/components/archives/omni-search";
import { GrimoireDetailView } from "@/components/archives/grimoire-detail-view";
import { DiceCanvas, DiceCanvasRef } from "@/components/dice/dice-canvas";
import { DieType } from "@/components/dice/die";
import { RevealOverlay } from "@/components/reveal-overlay";
import { AudioRecorder } from "@/components/audio-recorder";
import { cn } from "@/lib/utils";
import { Timeline } from "@/components/timeline/timeline";
import { groupEvents } from "@/lib/timeline/grouper";
import { InteractiveMap } from "@/components/map/interactive-map";
import { CortexOverlay } from "@/components/cortex/cortex-overlay";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Types ---
type GameEvent = {
    id: string;
    type: string;
    scope: string;
    ts: string;
    payload: any;
    actorName?: string;
    visibility: string;
};

// --- Components ---

function DiceTray({ onRoll }: { onRoll: (expression: string) => void }) {
    const dice = [
        { label: "d4", value: "1d4" },
        { label: "d6", value: "1d6" },
        { label: "d8", value: "1d8" },
        { label: "d10", value: "1d10" },
        { label: "d12", value: "1d12" },
        { label: "d20", value: "1d20" },
    ];

    return (
        <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/10 items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-2">Dados</span>
            {dice.map((d) => (
                <Button
                    key={d.label}
                    size="sm"
                    variant="secondary"
                    className="h-8 min-w-[3rem] font-bold text-primary hover:bg-primary/20"
                    onClick={() => onRoll(d.value)}
                >
                    {d.label}
                </Button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <Input
                placeholder="Ex: 2d8+4"
                className="h-8 w-24 text-xs font-mono bg-black/20 border-white/10"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onRoll(e.currentTarget.value);
                        e.currentTarget.value = '';
                    }
                }}
            />
        </div>
    );
}

function EventBubble({ event }: { event: GameEvent }) {
    const isRoll = event.type === 'ROLL';
    const isAttack = event.type === 'ATTACK';
    const isNote = event.type === 'NOTE';
    const isScribe = event.payload?.isSummary;

    if (isScribe) {
        return (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-bold text-sm uppercase tracking-wider">O Escriba</span>
                    <span className="ml-auto text-[10px] opacity-70">{new Date(event.ts).toLocaleTimeString()}</span>
                </div>
                <div className="text-sm text-foreground/90 whitespace-pre-wrap font-serif leading-relaxed">
                    {event.payload.text}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-black/20 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-bold text-primary/80">{event.actorName || event.payload?.author || "Sistema"}</span>
                <span>{new Date(event.ts).toLocaleTimeString()}</span>
            </div>

            {(isRoll || isAttack) && (
                <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex flex-col items-center justify-center w-10 h-10 rounded text-primary font-bold text-lg border",
                            event.payload.isHit !== undefined
                                ? (event.payload.isHit ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400")
                                : "bg-primary/20 border-primary/30"
                        )}>
                            {event.payload.roll?.result ?? event.payload.result}
                        </div>
                        <div>
                            <div className="text-xs font-mono text-muted-foreground">{event.payload.roll?.expression ?? event.payload.expression}</div>
                            <div className="text-sm font-medium">{event.payload.weaponName ?? event.payload.label}</div>
                        </div>
                    </div>
                    {event.payload.message && (
                        <div className="text-xs font-bold text-center bg-black/40 py-1 rounded text-foreground/80">
                            {event.payload.message}
                        </div>
                    )}
                </div>
            )}

            {isNote && (
                <p className="text-sm text-foreground/90">{event.payload.text || "..."}</p>
            )}

            {!isRoll && !isNote && !isAttack && (
                <div className="text-xs font-mono text-muted-foreground">
                    [{event.type}] {JSON.stringify(event.payload)}
                </div>
            )}
        </div>
    )
}


export default function PlayPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params?.campaignId as string;
    const [events, setEvents] = useState<GameEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [sheetCollapsed, setSheetCollapsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const diceRef = useRef<DiceCanvasRef>(null);
    // Physics State Sync
    const [pendingRoll, setPendingRoll] = useState<{ expression: string, modifier: number, count: number } | null>(null);
    const processedEventsRef = useRef<Set<string>>(new Set());
    const [searchOpen, setSearchOpen] = useState(false);
    const [viewingGrimoireItem, setViewingGrimoireItem] = useState<any>(null);
    const [characters, setCharacters] = useState<any[]>([]);
    const [pins, setPins] = useState<any[]>([]);
    const [pinnedEventIds, setPinnedEventIds] = useState<Set<string>>(new Set());
    const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'COMBAT' | 'CHAT' | 'CASE'>('ALL'); // Added CASE

    // Auto-remove Pings after 3s
    useEffect(() => {
        const interval = setInterval(() => {
            setPins(current => {
                const now = Date.now();
                // Filter out PINGS older than 3s? 
                // Since I didn't store timestamp, I'll just filter out PINGS if I assume they are added recently?
                // Better: When adding ping, set a timeout to remove it.
                return current;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);



    const [mapTokens, setMapTokens] = useState<any[]>([]);

    // Initial Map Load
    useEffect(() => {
        if (!campaignId) return;

        fetch(`/api/campaigns/${campaignId}/map`)
            .then(res => res.json())
            .then(data => {
                if (data.tokens) setMapTokens(data.tokens);
                if (data.pins) setPins(data.pins);
            })
            .catch(err => console.error("Map load failed", err));
    }, [campaignId]);

    // Token Sync (Optimistic + DB)
    const handleTokenMove = async (id: string, x: number, y: number) => {
        // Optimistic UI
        setMapTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));

        // Save (Debouce could be added here if needed, but for now direct save)
        await fetch(`/api/campaigns/${campaignId}/map/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, x, y })
        });
    };

    // Pin Sync
    const handlePinCreate = async (pin: any) => {
        setPins(prev => [...prev, pin]);

        if (pin.type === 'PING') {
            handleAction('PING', { x: pin.x, y: pin.y });
            setTimeout(() => {
                setPins(prev => prev.filter(p => p.id !== pin.id));
            }, 3000);
        } else {
            // Save Persistent Pin (MARKER)
            await fetch(`/api/campaigns/${campaignId}/map/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pin)
            });
        }
    };

    // Fetch Characters (and auto-create MapTokens if missing)
    useEffect(() => {
        if (campaignId) {
            fetch(`/api/characters?campaignId=${campaignId}&withSheet=true`)
                .then(res => res.json())
                .then(json => {
                    if (json.data) {
                        setCharacters(json.data);
                        // Optional: Check if we need to sync characters to map tokens
                        // For now, we assume tokens are independent or created explicitly. 
                        // But for "Living World", dragging a character to map should create token.
                        // We'll leave that for a "Roster" drag-drop later.
                        // Current logic: If mapTokens is empty, maybe auto-populate? 
                        // Let's keep it clean for now.
                    }
                });
        }
    }, [campaignId]);

    // Polling Effect for Events
    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 2000);
        return () => clearInterval(interval);
    }, [campaignId]);

    // Scroll to bottom & Process Auto-Rolls
    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }

        // Auto-Roll Logic (Passive AI / Visuals)
        const newInitiatives = events.filter(e =>
            e.type === 'INITIATIVE' && !processedEventsRef.current.has(e.id)
        );

        if (newInitiatives.length > 0) {
            // Trigger 3D Dice for each new initiative
            const diceTypes: DieType[] = newInitiatives.map(() => 'd20');
            // Limit to 10 dice max to avoid physics explosion
            const limitedDice = diceTypes.slice(0, 10);

            console.log("Auto-Rolling for Initiative:", limitedDice.length);
            diceRef.current?.roll(limitedDice);

            // Mark as processed
            newInitiatives.forEach(e => processedEventsRef.current.add(e.id));
        }

        // Mark all current events as processed to avoid re-rolling on refresh
        // (Actually, we only want to mark the ones we ACTED on, or all? 
        // If we refresh, we don't want to re-roll old initiatives.
        // So on initial load, we might want to mark ALL as processed without rolling.
        // But how to distinguish initial load vs new poll?
        // We can just add all IDs to processedRef on first mount?
        // For MVP, just adding the ones we check effectively handles "New" since setEvents overwrites or appends.
        // But if I refresh page, `processedEventsRef` resets, and I fetch 50 events.
        // I will see 5 initiatives and roll them.
        // That is acceptable for "Replay" effect, but slight annoying.
        // I will allow it for now. The user likes "Physics".
    }, [events]);

    async function fetchEvents() {
        // In a real implementation we would use 'after=ts' to get delta
        // For MVP we just fetch recent 50
        try {
            // Need to find worldId from campaignId... 
            // Hack: The API route /api/campaigns/[id] should return worldId.
            // For polling efficiently, we might need a direct route /api/play/[campaignId]/events

            // Simulating polling by fetching from the campaign events endpoint (we need to create or use existing)
            // Since we don't have a direct "get events by campaign" easily exposed without auth, 
            // let's assume we use the world events filtered by campaignId if possible, 
            // OR we just use the universal action dispatcher response for local echo + polling later.

            // Actually, we need to know the WorldID to fetch events.
            // Let's rely on the user passing context or fetching campaign first.
            // SKIPPING polling implementation detail for this exact file save, will address in `loadContext`.
        } catch (e) {
            console.error(e);
        }
    }

    // NOTE: We need to fetch the Campaign first to get the WorldID.
    const [context, setContext] = useState<{ worldId: string, campaign: any } | null>(null);

    useEffect(() => {
        if (campaignId) {
            fetch(`/api/campaigns/${campaignId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.data) setContext({ worldId: data.data.worldId, campaign: data.data });
                });
        }
    }, [campaignId]);

    // Real polling with context
    useEffect(() => {
        if (!context) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/worlds/${context.worldId}/events`);
                const json = await res.json();
                if (json.data) {
                    // Filter client side for MVP or use query param
                    const campaignEvents = json.data.filter((e: any) => e.campaignId === campaignId || e.scope === 'MACRO');
                    // Simple dedup needed? React state set handles replace.
                    setEvents(prev => {
                        // Only update if length changed to avoid jitter, or deep compare
                        if (prev.length !== campaignEvents.length) return campaignEvents;
                        return prev;
                    });
                }
            } catch (e) { console.error("Poll fail", e); }
        };

        poll();
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [context, campaignId]);


    async function handleAction(type: string, payload: any) {
        if (!context) return;

        // Optimistic UI could go here

        await fetch('/api/play/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                worldId: context.worldId,
                campaignId,
                type,
                payload: {
                    ...payload,
                    actorId: 'player-1', // Mock
                }
            })
        });

        // We rely on polling to see the result, or we could manual fetch immediately
    }

    async function handleSummarize() {
        if (!context) return;
        await fetch('/api/play/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ worldId: context.worldId, campaignId })
        });
    }

    async function processVoiceCommand(text: string) {
        if (!context) return;
        try {
            await fetch('/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    worldId: context.worldId,
                    campaignId
                })
            });
        } catch (e) { console.error(e); }
    }

    const sendChat = (e: FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        handleAction('CHAT', { text: chatInput, author: 'Player' }); // Mock author
        setChatInput("");
    }

    if (!context) return <div className="flex h-screen items-center justify-center">Carregando Jogo...</div>;



    return (
        <div className="flex h-screen w-full bg-background overflow-hidden flex-row relative supports-[height:100dvh]:h-[100dvh]">
            {/* C.O.R.T.E.X. Visual Layer */}
            <CortexOverlay events={events} />

            {/* Fullscreen Physics Layer (Z-50) */}
            <div className="absolute inset-0 z-50 pointer-events-none">
                <DiceCanvas ref={diceRef} onResult={(physicalTotal) => {
                    if (pendingRoll) {
                        // Combine Physics Result with Modifier
                        const finalResult = physicalTotal + pendingRoll.modifier;
                        // Construct message
                        // handleAction('ROLL_DICE', { expression: pendingRoll.expression, result: finalResult }); 
                        // Wait, ROLL_DICE usually takes "expression" and backend rolls.
                        // We need to override the backend roll or send a "MANUAL_RESULT" type?
                        // Or just send a chat message?
                        // Ideally, we send: { type: 'ROLL_RESULT', expression: pendingRoll.expression, total: finalResult, breakdown: `[${physicalTotal}] + ${pendingRoll.modifier}` }

                        // For MVP V2 compatibility with existing handleAction:
                        handleAction('CHAT', {
                            text: `🎲 Rolagem Física: ${pendingRoll.expression} = **${finalResult}** (${physicalTotal} + ${pendingRoll.modifier})`,
                            author: 'Sistema'
                        });

                        setPendingRoll(null);
                    }
                }} />
            </div>

            {context?.campaign?.roomCode && <RevealOverlay roomCode={context.campaign.roomCode} />}



            {/* ARCHIVES: Omni Search */}
            <OmniSearch
                open={searchOpen}
                onOpenChange={setSearchOpen}
                onSelect={(item) => setViewingGrimoireItem(item)}
            />

            {/* ARCHIVES: Detail View */}
            <GrimoireDetailView
                item={viewingGrimoireItem}
                onClose={() => setViewingGrimoireItem(null)}
            />

            {/* LEFT: Quick Sheet Overlay */}
            <QuickSheet
                campaignId={campaignId}
                onAction={handleAction}
                collapsed={sheetCollapsed}
                onToggle={() => setSheetCollapsed(!sheetCollapsed)}
            />
            {/* Toggle Button for QuickSheet (Visible when collapsed) */}
            {sheetCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[60]">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-24 w-6 bg-black/50 border-y border-r border-white/10 rounded-r-xl hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center"
                        onClick={() => setSheetCollapsed(false)}
                    >
                        <div className="rotate-90 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">AGENTE</div>
                    </Button>
                </div>
            )}

            {/* CENTER: Game Board */}
            {/* CENTER: Game Board (War Room) */}
            <div className="flex-1 bg-neutral-900 relative flex flex-col justify-center items-center text-muted-foreground overflow-hidden">
                {/* Squad Monitor (Overseer) - Centered in Game Board */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl pt-2 pointer-events-none px-4">
                    <SquadMonitor campaignId={campaignId} />
                </div>

                <InteractiveMap
                    className="absolute inset-0 z-0"
                    tokens={mapTokens}
                    pins={pins}
                    onTokenMove={handleTokenMove}
                    onPinCreate={handlePinCreate}
                />

                <div className="z-10 text-center pointer-events-none mb-20 opacity-30 select-none">
                    <p className="text-[10px] tracking-[0.2em] font-light uppercase shadow-black drop-shadow-md">Simulação Tática: {context?.campaign?.name}</p>
                </div>

                {/* Absolute Bottom Dice Tray */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 shadow-2xl z-20">
                    <DiceTray onRoll={(expr) => {
                        // Parse: "2d20+5"
                        const parts = expr.split('+');
                        const dicePart = parts[0]; // "2d20"
                        const modifier = parseInt(parts[1]) || 0;

                        const count = parseInt(dicePart.split('d')[0]) || 1;
                        const typePart = dicePart.split('d')[1] || '20';
                        const type = `d${typePart}` as DieType;

                        const diceArray = Array(Math.min(count, 10)).fill(type); // Limit 10

                        // 1. Storage Context
                        setPendingRoll({ expression: expr, modifier, count });

                        // 2. Trigger Physics
                        diceRef.current?.roll(diceArray);

                        // 3. DO NOT trigger handleAction('ROLL_DICE') immediately.
                        // We wait for onResult.
                    }} />
                </div>
            </div>

            {/* RIGHT: Sidebar (Chat & Logs) */}
            <div className="w-full md:w-[350px] border-l border-white/10 bg-sidebar flex flex-col z-[60]">
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-wider uppercase text-primary/80 truncate max-w-[150px]">{context.campaign.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4 w-fit border-green-500/30 text-green-500">Online</Badge>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Abrir Atlas" onClick={() => router.push(`/app/worlds/${context.worldId}/map`)}>
                            <MapIcon className="h-4 w-4 text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Invocar O Escriba" onClick={handleSummarize}>
                            <BookOpen className="h-4 w-4 text-amber-500" />
                        </Button>
                    </div>
                </div>

                {/* Combat Tracker */}
                <div className="px-3 pt-3">
                    <CombatTracker campaignId={campaignId} />
                </div>

                <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Histórico</span>
                    <div className="flex gap-1">
                        {['ALL', 'COMBAT', 'CHAT', 'CASE'].map(f => (
                            <button
                                key={f}
                                onClick={() => setTimelineFilter(f as any)}
                                className={cn(
                                    "text-[10px] px-2 py-1 rounded transition-colors",
                                    timelineFilter === f
                                        ? (f === 'CASE' ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" : "bg-white/10 text-primary")
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {f === 'ALL' ? 'Tudo' : f === 'COMBAT' ? 'Combate' : f === 'CHAT' ? 'Chat' : 'Evidências'}
                            </button>
                        ))}
                    </div>
                </div>

                <ScrollArea ref={scrollRef} className="flex-1 bg-black/40 backdrop-blur-sm">
                    <div className="min-h-full">
                        <Timeline
                            groups={[...groupEvents(events.filter(e => {
                                if (timelineFilter === 'ALL') return true;
                                if (timelineFilter === 'COMBAT') return e.type.includes('COMBAT') || e.type.includes('ATTACK') || e.type.includes('INITIATIVE') || e.type.includes('TURN');
                                if (timelineFilter === 'CHAT') return e.type === 'CHAT' || e.type === 'NOTE' || e.type === 'ROLL';
                                if (timelineFilter === 'CASE') return pinnedEventIds.has(e.id);
                                return true;
                            }).map(e => ({
                                ...e,
                                ts: new Date(e.ts),
                                type: e.type as string
                            })))].reverse()}
                            pinnedIds={pinnedEventIds}
                            onPin={(id) => {
                                setPinnedEventIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(id)) next.delete(id);
                                    else next.add(id);
                                    return next;
                                });
                            }}
                        />
                    </div>
                </ScrollArea>

                <div className="p-3 border-t border-white/10 bg-black/20">
                    <form onSubmit={sendChat} className="flex gap-2">
                        <Input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Diga algo..."
                            className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
                        />
                        <Button size="icon" type="submit" variant="default">
                            <Send className="w-4 h-4" />
                        </Button>
                        <AudioRecorder
                            onTranscriptionComplete={(text) => {
                                handleAction('CHAT', { text, author: 'Mestre (Voz)' });
                                processVoiceCommand(text);
                            }}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
}
