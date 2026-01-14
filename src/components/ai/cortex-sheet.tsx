"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Plus, X, Brain, Scroll, Sword, Dices, ChevronRight, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCortex } from "./cortex-provider";
import { cn } from "@/lib/utils";
import { CortexInput } from "./cortex-input";

export function CortexSheet() {
    const { isOpen, setIsOpen, activeSessionId, startNewSession, history, loadSession } = useCortex();
    const [sessions, setSessions] = useState<any[]>([]);

    // Fetch session list when opening sidebar
    useEffect(() => {
        if (isOpen) {
            // TODO: Pass actual CampaignId here. For now, we list all or filter by active campaign in Context
            // Assuming context has campaignId, but context is naive now. Let's just fetch all recent for user.
            fetch("/api/ai/chat?campaignId=demo") // Mock campaignId for list
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setSessions(data);
                });
        }
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="right" className="w-full sm:w-[450px] sm:max-w-none flex flex-col p-0 gap-0 border-l border-white/10 bg-[#0a0a0a]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/50 shadow-[0_0_10px_-3px_rgba(255,100,255,0.5)]">
                            <Brain className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-base font-bold tracking-tight">C.O.R.T.E.X.</SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground">Neural Interface v2.3</SheetDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={startNewSession} title="Nova Conversa">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content Area: Two States (History List OR Active Chat) */}
                <div className="flex-1 overflow-hidden relative group">
                    {!activeSessionId && sessions.length > 0 && history.length === 0 ? (
                        // STATE: Session List
                        <ScrollArea className="h-full px-4 py-4">
                            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Histórico Recente</h3>
                            <div className="space-y-2">
                                {sessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => loadSession(session.id)}
                                        className="w-full text-left p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group flex flex-col gap-1"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm truncate pr-2 text-foreground/90">{session.title}</span>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(session.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        // STATE: Active Chat Thread
                        <ScrollArea className="h-full px-4 py-4">
                            <div className="space-y-6 pb-4">
                                {history.map((msg, idx) => (
                                    <div key={idx} className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-[#1a1a1a] border border-white/10 text-foreground rounded-bl-none"
                                        )}>
                                            {/* Icon for AI */}
                                            {msg.role === "assistant" && (
                                                <div className="flex items-center gap-2 mb-2 text-primary/80 border-b border-white/5 pb-2">
                                                    {getIntentIcon(msg.intent)}
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">{msg.intent || "RESPOSTA"}</span>
                                                </div>
                                            )}

                                            <div className="whitespace-pre-wrap">{msg.content}</div>

                                            {/* Render Meta / Result if available */}
                                            {msg.meta && (
                                                <div className="mt-2 p-2 bg-black/30 rounded border border-white/5 text-xs font-mono text-muted-foreground">
                                                    {/* Custom Rendering based on Intent */}
                                                    {msg.intent === "ROLL" && (
                                                        <div className="flex items-center justify-between">
                                                            <span>Resultado:</span>
                                                            <span className="text-emerald-400 font-bold text-base">{msg.meta.total}</span>
                                                        </div>
                                                    )}
                                                    {msg.intent === "SUMMON" && (
                                                        <div className="text-emerald-400">
                                                            Invocado com sucesso.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground px-1">
                                            {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm", { locale: ptBR }) : ""}
                                        </span>
                                    </div>
                                ))}
                                {history.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center gap-2 opacity-50">
                                        <Brain className="h-8 w-8 text-primary" />
                                        <p className="text-sm">Inicie uma nova linha de pensamento...</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer Input Area */}
                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur">
                    {/* We reuse the internal logic of CortexInput BUT we need to make sure CortexInput
                        doesn't duplicate the UI logic if it is placed here.
                        Actually, CortexInput currently IS the input. 
                        But we want the Input to be *inside* this sheet for "Continuing the conversation".
                        Wait, the User wants the input on the TopBar to OPEN this sheet.
                        So:
                        1. TopBar has a CortexInput (Trigger).
                        2. Sidebar has a CortexInput (Chat).
                        
                        We need to adapt CortexInput to accept "onSubmit" or just use the Context `sendMessage`.
                    */}
                    <CortexInput mode="chat" className="shadow-none border-white/10 bg-white/5" />
                </div>

            </SheetContent>
        </Sheet>
    );
}

function getIntentIcon(intent?: string) {
    if (!intent) return <MessageSquare className="h-3 w-3" />;
    switch (intent) {
        case "ROLL": return <Dices className="h-3 w-3" />;
        case "ATTACK": return <Sword className="h-3 w-3" />;
        case "SUMMON": return <Plus className="h-3 w-3" />;
        case "INFO": return <Scroll className="h-3 w-3" />;
        default: return <Sparkles className="h-3 w-3" />;
    }
}
