"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Send, Shield, Sparkles, BookOpen } from "lucide-react";
import { QuickSheet } from "./quick-sheet";
import { RevealOverlay } from "@/components/reveal-overlay";
import { AudioRecorder } from "@/components/audio-recorder";
import { cn } from "@/lib/utils";

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
    const campaignId = params?.campaignId as string;
    const [events, setEvents] = useState<GameEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [sheetCollapsed, setSheetCollapsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Polling Effect
    useEffect(() => {
        // Initial fetch
        fetchEvents();

        const interval = setInterval(fetchEvents, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [campaignId]);

    // Scroll to bottom on new events
    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }
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
        <div className="flex h-screen w-full bg-background overflow-hidden flex-row">
            {context?.campaign?.roomCode && <RevealOverlay roomCode={context.campaign.roomCode} />}
            {/* LEFT: Quick Sheet */}
            <QuickSheet
                campaignId={campaignId}
                onAction={handleAction}
                collapsed={sheetCollapsed}
                onToggle={() => setSheetCollapsed(!sheetCollapsed)}
            />

            {/* CENTER: Game Board (Placeholder) */}
            <div className="flex-1 bg-neutral-900/50 relative flex flex-col justify-center items-center text-muted-foreground p-4 overflow-hidden">
                <Sparkles className="w-16 h-16 opacity-20 mb-4" />
                <h2 className="text-xl font-bold opacity-50">Mesa de Jogo</h2>
                <p className="opacity-40 max-w-md text-center">
                    O mapa e tokens serão renderizados aqui futuramente.
                    Por enquanto, utilize o Chat e o Rolador de Dados à direita.
                </p>

                {/* Absolute Bottom Dice Tray */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 shadow-2xl">
                    <DiceTray onRoll={(expr) => handleAction('ROLL_DICE', { expression: expr })} />
                </div>
            </div>

            {/* RIGHT: Sidebar (Chat & Logs) */}
            <div className="w-full md:w-[350px] border-l border-white/10 bg-sidebar flex flex-col z-20">
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-wider uppercase text-primary/80 truncate max-w-[200px]">{context.campaign.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4 w-fit border-green-500/30 text-green-500">Online</Badge>
                    </div>
                    <Button variant="ghost" size="icon" title="Invocar O Escriba" onClick={handleSummarize}>
                        <BookOpen className="h-4 w-4 text-amber-500" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="flex flex-col gap-3 justify-end min-h-full">
                        {events.length === 0 && (
                            <div className="text-center text-xs text-muted-foreground py-10 opacity-50">
                                Nenhum evento registrado. <br /> Role os dados!
                            </div>
                        )}
                        {events.map((e) => <EventBubble key={e.id} event={e} />)}
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
