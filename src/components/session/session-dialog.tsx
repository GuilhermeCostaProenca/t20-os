"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, NotebookPen, QrCode, Shield, Sparkles, Swords, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Reduced Card usage
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { generateQrDataUrl } from "@/lib/qr";
import { useSession } from "./session-context";
import { SessionSummaryButton } from "./session-summary-button";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function randomRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function SessionDialog() {
  const {
    elapsedMs,
    state,
    visibility,
    setVisibility,
    startSession,
    endSession,
    toggleTimer,
    resetTimer,
    addNote,
    addNpcMention,
    addItemMention,
    rollD20,
  } = useSession();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [npc, setNpc] = useState("");
  const [item, setItem] = useState("");
  const [mod, setMod] = useState(0);
  const [roomCode, setRoomCode] = useState("");
  const [qrData, setQrData] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [revealType, setRevealType] = useState<"npc" | "item" | "image" | "note">("note");
  const [revealTitle, setRevealTitle] = useState("");
  const [revealContent, setRevealContent] = useState("");
  const [revealImage, setRevealImage] = useState("");
  const [revealStatus, setRevealStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("t20-room-code");
    const code = stored || randomRoomCode();
    setRoomCode(code);
    if (!stored) localStorage.setItem("t20-room-code", code);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpen = () => setOpen(true);
    window.addEventListener("t20-open-session", handleOpen as EventListener);
    return () => window.removeEventListener("t20-open-session", handleOpen as EventListener);
  }, []);

  const roomLink =
    typeof window !== "undefined" && roomCode ? `${window.location.origin}/play/${roomCode}` : "";

  const events = useMemo(
    () =>
      state.events.map((event) => ({
        ...event,
        time: new Date(event.timestamp).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      })),
    [state.events]
  );

  const timerLabel = state.running ? "Pausar" : state.startedAt ? "Retomar" : "Iniciar";

  async function handleGenerateQr() {
    if (!roomLink) return;
    setQrLoading(true);
    try {
      const dataUrl = await generateQrDataUrl(roomLink);
      setQrData(dataUrl);
    } catch (err) {
      setRevealStatus("Falha ao gerar QR Code");
      setTimeout(() => setRevealStatus(null), 2000);
    } finally {
      setQrLoading(false);
    }
  }

  async function copyLink() {
    if (!roomLink) return;
    try {
      await navigator.clipboard.writeText(roomLink);
      setRevealStatus("Link copiado");
    } catch (err) {
      setRevealStatus("Falha ao copiar link");
    } finally {
      setTimeout(() => setRevealStatus(null), 1500);
    }
  }

  async function handleRevealSubmit() {
    if (!roomCode || !revealTitle.trim()) {
      setRevealStatus("Preencha o room code e o titulo.");
      return;
    }
    setRevealStatus("Enviando...");
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          type: revealType,
          title: revealTitle,
          content: revealContent,
          imageUrl: revealImage || undefined,
          visibility: "players",
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Falha ao revelar");
      }
      setRevealStatus("Enviado para jogadores");
      setRevealContent("");
      setRevealImage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      setRevealStatus(msg);
    } finally {
      setTimeout(() => setRevealStatus(null), 2000);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-primary-foreground shadow-[0_0_24px_rgba(226,69,69,0.35)] hover:bg-primary/90">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Modo Sessão</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-zinc-950 border-white/10">
        <SheetHeader className="px-6 py-4 border-b border-white/10 bg-black/20">
          <SheetTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" /> Centro de Comando
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider bg-white/5 border-white/10">
              COD: {roomCode || "----"}
            </Badge>
            {roomLink && (
              <span className="text-xs text-muted-foreground w-full truncate text-right">
                ...{roomLink.slice(-15)}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pb-20">

            {/* Timer Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Clock3 className="h-3 w-3" /> Cronômetro
                </h3>
                <div className="text-2xl font-mono font-bold text-primary">{formatElapsed(elapsedMs)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={state.startedAt ? toggleTimer : startSession} className="flex-1 bg-white/10 hover:bg-white/20 text-white">
                  {timerLabel}
                </Button>
                <Button size="sm" variant="outline" onClick={resetTimer} disabled={!state.startedAt} className="border-white/10">
                  Reset
                </Button>
              </div>

              <div className="flex gap-2 p-1 bg-black/40 rounded-lg">
                <Button
                  variant={visibility === "players" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setVisibility("players")}
                  className="flex-1 h-7 text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" /> Público
                </Button>
                <Button
                  variant={visibility === "master" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setVisibility("master")}
                  className="flex-1 h-7 text-xs"
                >
                  <User className="h-3 w-3 mr-1" /> Privado
                </Button>
              </div>
            </div>

            <Separator className="border-white/5" />

            {/* Quick Shortcuts */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80">Atalhos de Log</h3>

              <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Nota rápida..."
                  className="border-0 bg-transparent h-9 focus-visible:ring-0 placeholder:text-zinc-600"
                />
                <Button size="sm" onClick={() => { addNote(note); setNote(""); }} disabled={!note.trim()} className="h-9">
                  <NotebookPen className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Input
                    value={npc}
                    onChange={e => setNpc(e.target.value)}
                    placeholder="NPC..."
                    className="h-8 text-xs bg-white/5 border-white/10"
                  />
                  <Button size="sm" variant="outline" onClick={() => { addNpcMention(npc); setNpc(""); }} disabled={!npc.trim()} className="h-7 text-xs">
                    Mencionar NPC
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    value={item}
                    onChange={e => setItem(e.target.value)}
                    placeholder="Item..."
                    className="h-8 text-xs bg-white/5 border-white/10"
                  />
                  <Button size="sm" variant="outline" onClick={() => { addItemMention(item); setItem(""); }} disabled={!item.trim()} className="h-7 text-xs">
                    Mencionar Item
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="border-white/5" />

            {/* Revelations */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center justify-between">
                <span>Transmissão</span>
                {roomLink && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(roomLink, "_blank")}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyLink}>
                      <QrCode className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </h3>

              <select
                value={revealType}
                onChange={(e) => setRevealType(e.target.value as typeof revealType)}
                className="w-full h-8 rounded-md border border-white/10 bg-black/40 px-3 text-xs text-white"
              >
                <option value="note">Nota Pública</option>
                <option value="npc">Revelar NPC</option>
                <option value="item">Revelar Item</option>
                <option value="image">Mostrar Imagem</option>
              </select>

              <Input value={revealTitle} onChange={e => setRevealTitle(e.target.value)} placeholder="Título..." className="h-8 text-xs bg-white/5 border-white/10" />
              <Textarea value={revealContent} onChange={e => setRevealContent(e.target.value)} placeholder="Conteúdo da revelação..." rows={2} className="text-xs bg-white/5 border-white/10" />

              <Button onClick={handleRevealSubmit} className="w-full text-xs" disabled={!roomCode}>
                Transmitir para Players
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Log */}
        <div className="h-64 border-t border-white/10 bg-black/40 flex flex-col">
          <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Log de Eventos</span>
            <SessionSummaryButton />
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Sessão aguardando início...</p>
              ) : (
                events.map(evt => (
                  <div key={evt.id} className="text-xs flex gap-2">
                    <span className="text-zinc-600 font-mono flex-shrink-0">{evt.time}</span>
                    <span className={cn("text-zinc-300", evt.visibility === "master" && "text-yellow-500/80")}>
                      {evt.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
