"use client";

import { useState, useRef, useEffect } from "react";
import { Command, Loader2, Mic, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCortex } from "@/components/ai/cortex-provider";

interface CortexInputProps {
    className?: string;
    mode?: "default" | "chat"; // default = topbar trigger, chat = inside sidebar
}

export function CortexInput({ className, mode = "default" }: CortexInputProps) {
    const [query, setQuery] = useState("");
    const [isListening, setIsListening] = useState(false); // Local listening state (UI only)
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Connect to Context
    const { sendMessage, isOpen } = useCortex();
    const [localLoading, setLocalLoading] = useState(false);

    // Focus shortcut (Ctrl+K) - Only if in default mode or focused
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        if (mode === "default") {
            document.addEventListener("keydown", down);
            return () => document.removeEventListener("keydown", down);
        }
    }, [mode]);

    async function toggleRecording() {
        if (isListening && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

                setLocalLoading(true);
                const loadingToast = toast.loading("Ouvindo...", { description: "Traduzindo áudio para texto..." });

                try {
                    const formData = new FormData();
                    formData.append("file", audioBlob);

                    const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData });
                    const data = await res.json();

                    if (data.text) {
                        setQuery(data.text);
                        // Auto-submit if voice? Maybe not, let user confirm.
                        toast.dismiss(loadingToast);
                    } else {
                        toast.error("Não entendi.", { id: loadingToast });
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("Erro na transcrição.", { id: loadingToast });
                } finally {
                    setLocalLoading(false);
                    stream.getTracks().forEach(track => track.stop());
                    mediaRecorderRef.current = null;
                }
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (err) {
            console.error(err);
            toast.error("Microfone bloqueado ou indisponível.");
        }
    }

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!query.trim() || localLoading) return;

        setLocalLoading(true);
        try {
            // Use Context to send message
            // TODO: Get real campaignId from somewhere (URL or Context)
            // For now, we mock or try to extract from URL if possible
            const route = window.location.pathname;
            const match = route.match(/\/([a-zA-Z0-9]{20,})/);
            const campaignId = match ? match[1] : "demo";

            await sendMessage(query, campaignId);
            setQuery(""); // Clear input
        } catch (err) {
            console.error(err);
        } finally {
            setLocalLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "relative flex w-full items-center overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/50 group",
                mode === "default" && "max-w-lg shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] backdrop-blur-md",
                className
            )}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors">
                {localLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="h-4 w-4" />
                )}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isListening ? "Ouvindo..." : (mode === "default" ? "C.O.R.T.E.X. (Ctrl+K)" : "Digite um comando...")}
                className="flex-1 bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                disabled={localLoading}
            />

            <div className="flex items-center gap-1 pr-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7 transition-colors rounded-full", isListening && "text-red-500 bg-red-500/10 animate-pulse ring-1 ring-red-500/50")}
                    onClick={toggleRecording}
                >
                    {isListening ? (
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                    ) : (
                        <Mic className="h-3.5 w-3.5" />
                    )}
                </Button>
                {query.length > 0 && (
                    <Button type="submit" size="icon" className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Send className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Visual Feedback for AI State */}
            <div className={cn(
                "absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-1000",
                localLoading ? "w-full opacity-100 animate-pulse" : "w-0 opacity-0"
            )} />
        </form>
    );
}
