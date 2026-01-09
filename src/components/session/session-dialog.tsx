"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, NotebookPen, QrCode, Shield, Sparkles, Swords } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { generateQrDataUrl } from "@/lib/qr";
import { useSession } from "./session-context";
import { SessionSummaryButton } from "./session-summary-button";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground shadow-[0_0_24px_rgba(226,69,69,0.35)] hover:bg-primary/90">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Modo sessao</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-5xl flex-col overflow-hidden border-white/10 bg-card/90 p-0 text-left backdrop-blur">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Modo Sessão</DialogTitle>
          <DialogDescription>
            Timer, rolagens, NPCs, notas rapidas e revelacoes para jogadores.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3 px-6">
            <Badge className="border-primary/25 bg-primary/10 text-primary">Room code: {roomCode || "----"}</Badge>
            <Button variant="outline" size="sm" onClick={copyLink} disabled={!roomLink}>
              Copiar link
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateQr} disabled={!roomLink || qrLoading}>
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            {qrData ? (
              <img
                src={qrData}
                alt="QR Code para jogadores"
                className="h-20 w-20 rounded-lg border border-white/10 bg-white/5 p-1"
              />
            ) : null}
            {revealStatus ? <span className="text-xs text-muted-foreground">{revealStatus}</span> : null}
          </div>

          <div className="grid gap-4 px-6 pb-6 md:grid-cols-[1.2fr_1fr]">
            <Card className="chrome-panel border-white/10 bg-black/30">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-primary" />
                    <CardTitle>Timer</CardTitle>
                  </div>
                  <Badge className="border-primary/25 bg-primary/10 text-primary">
                    {visibility === "players" ? "Visivel aos jogadores" : "So mestre"}
                  </Badge>
                </div>
                <CardDescription>Controle rapido para encontros presenciais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-black tracking-tight">{formatElapsed(elapsedMs)}</div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={state.startedAt ? toggleTimer : startSession} className="shadow-[0_0_18px_rgba(226,69,69,0.3)]">
                    {timerLabel}
                  </Button>
                  <Button variant="outline" onClick={resetTimer} disabled={!state.startedAt}>
                    Resetar
                  </Button>
                  <Button variant="destructive" onClick={endSession} disabled={!state.startedAt}>
                    Encerrar
                  </Button>
                  <Button
                    variant={visibility === "players" ? "default" : "outline"}
                    onClick={() => setVisibility("players")}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Jogadores
                  </Button>
                  <Button
                    variant={visibility === "master" ? "default" : "outline"}
                    onClick={() => setVisibility("master")}
                    className="gap-2"
                  >
                    <NotebookPen className="h-4 w-4" />
                    Mestre
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="chrome-panel border-white/10 bg-black/30">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Atalhos rapidos</CardTitle>
                  <Badge variant="outline" className="text-muted-foreground">
                    Log automatico
                  </Badge>
                </div>
                <CardDescription>Acoes curtas que alimentam o log e os recentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Nota rapida</label>
                  <div className="flex gap-2">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Registrar pista, decisao ou evento" />
                    <Button
                      onClick={() => {
                        addNote(note);
                        setNote("");
                      }}
                      disabled={!note.trim()}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">NPC citado</label>
                  <div className="flex gap-2">
                    <Input value={npc} onChange={(e) => setNpc(e.target.value)} placeholder="Nome do NPC" />
                    <Button
                      onClick={() => {
                        addNpcMention(npc);
                        setNpc("");
                      }}
                      disabled={!npc.trim()}
                    >
                      Registrar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Item citado</label>
                  <div className="flex gap-2">
                    <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item ou artefato" />
                    <Button
                      onClick={() => {
                        addItemMention(item);
                        setItem("");
                      }}
                      disabled={!item.trim()}
                    >
                      Registrar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Rolagem d20</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={mod} onChange={(e) => setMod(Number(e.target.value) || 0)} className="w-20" />
                    <Button className="gap-2" onClick={() => rollD20(mod)}>
                      <Swords className="h-4 w-4" />
                      Rolar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="px-6 pb-6">
            <Card className="chrome-panel border-white/10 bg-black/30">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Revelar para jogadores</CardTitle>
                  <Badge variant="outline" className="text-muted-foreground">
                    /play/{roomCode || "----"}
                  </Badge>
                </div>
                <CardDescription>Envie NPCs, itens, imagens ou notas curtas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-sm text-muted-foreground">Tipo</label>
                    <select
                      value={revealType}
                      onChange={(e) => setRevealType(e.target.value as typeof revealType)}
                      className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                    >
                      <option value="npc">NPC</option>
                      <option value="item">Item</option>
                      <option value="image">Imagem</option>
                      <option value="note">Nota</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-sm text-muted-foreground">Titulo</label>
                    <Input value={revealTitle} onChange={(e) => setRevealTitle(e.target.value)} placeholder="Ex.: Serpente Rubra" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Texto curto</label>
                  <Textarea value={revealContent} onChange={(e) => setRevealContent(e.target.value)} rows={3} placeholder="Resumo rapido, descricao ou pista" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">URL da imagem (opcional)</label>
                  <Input value={revealImage} onChange={(e) => setRevealImage(e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleRevealSubmit} className="shadow-[0_0_18px_rgba(226,69,69,0.3)]">
                    Mostrar
                  </Button>
                  {revealStatus ? <span className="text-xs text-muted-foreground">{revealStatus}</span> : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="border-white/10" />

          <div className="px-6 pb-3">
            <SessionSummaryButton />
          </div>

          <div className="max-h-72 overflow-y-auto px-6 pb-6">
            <div className="flex items-center justify-between py-4">
              <h3 className="text-sm uppercase tracking-[0.16em] text-primary">Log da sessao</h3>
              <Badge variant="outline" className="text-muted-foreground">
                {events.length} eventos
              </Badge>
            </div>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento registrado ainda. Comece a sessao ou adicione uma nota.
                </p>
              ) : (
                events.map((event) => {
                  const label = (event.displayType ?? event.type ?? "").toString().replace(/_/g, " ");
                  return (
                    <div
                      key={event.id}
                      className="flex items-start justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize text-primary">
                            {label}
                          </Badge>
                          <Badge variant="outline" className="text-[11px] uppercase tracking-[0.14em]">
                            {event.visibility === "players" ? "Mesa" : "Mestre"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </div>
                        <p className="text-sm text-foreground">{event.message}</p>
                      </div>
                      {event.breakdown?.toHit ? (
                        <span className="text-sm font-semibold text-primary">{event.breakdown.toHit.total}</span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
