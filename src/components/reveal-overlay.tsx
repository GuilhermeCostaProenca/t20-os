"use client";

import { useEffect, useState } from "react";
import { X, Map as MapIcon, Image as ImageIcon, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RevealOverlayProps {
    roomCode: string;
}

type RevealData = {
    id: string;
    type: "NPC" | "LOCATION" | "IMAGE";
    title: string;
    content?: any; // { text: string }
    imageUrl?: string;
    createdAt: string;
};

export function RevealOverlay({ roomCode }: RevealOverlayProps) {
    const [reveal, setReveal] = useState<RevealData | null>(null);
    const [open, setOpen] = useState(false);
    const [lastSeenId, setLastSeenId] = useState<string | null>(null);

    useEffect(() => {
        if (!roomCode) return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/reveal?roomCode=${roomCode}`);
                const json = await res.json();

                if (json.data) {
                    const data = json.data as RevealData;
                    // If it's a new reveal we haven't seen (or dismissed)
                    // Check if the reveal timestamp is recent (e.g., last 5 mins) to avoid popping old stuff on load?
                    // For now, let's just trigger if ID is different from last seen.
                    if (data.id !== lastSeenId) {
                        setReveal(data);
                        setLastSeenId(data.id);
                        setOpen(true);
                    }
                }
            } catch (e) {
                // Silent fail
            }
        };

        const interval = setInterval(poll, 3000);
        poll(); // Initial check
        return () => clearInterval(interval);
    }, [roomCode, lastSeenId]);

    if (!reveal) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-hidden gap-0">
                <div className="relative isolate">
                    {/* Background Blur Image */}
                    {reveal.imageUrl && (
                        <div className="absolute inset-0 z-[-1]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={reveal.imageUrl} alt="" className="w-full h-full object-cover opacity-20 blur-xl" />
                        </div>
                    )}

                    <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-mono uppercase text-primary tracking-widest flex items-center gap-2">
                                    {reveal.type === 'NPC' ? <FileText className="h-3 w-3" /> :
                                        reveal.type === 'LOCATION' ? <MapIcon className="h-3 w-3" /> :
                                            <ImageIcon className="h-3 w-3" />}
                                    Revelação
                                </span>
                                <DialogTitle className="text-2xl font-bold font-serif">{reveal.title}</DialogTitle>
                            </div>
                            {/* Close is handled by X button of Dialog primitive mostly, but we can add explicit */}
                        </div>

                        {reveal.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/50 shadow-2xl">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={reveal.imageUrl} alt={reveal.title} className="w-full h-auto max-h-[60vh] object-contain" />
                            </div>
                        )}

                        {reveal.content && reveal.content.text && (
                            <div className="prose prose-invert max-w-none text-sm text-gray-300 bg-black/20 p-4 rounded-lg border border-white/5 whitespace-pre-wrap">
                                {reveal.content.text}
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
                        </div>
                    </div>
                </div>
                <span className="sr-only">
                    <DialogDescription>
                        {reveal.title} - {reveal.type}
                    </DialogDescription>
                </span>
            </DialogContent>
        </Dialog>
    );
}
