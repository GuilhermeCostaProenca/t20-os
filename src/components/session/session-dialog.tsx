"use client";

import { useMemo, useState } from "react";
import { Clock3, NotebookPen, Shield, Sparkles, Swords } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useSession } from "./session-context";

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

export function SessionDialog() {
  const {
    elapsedMs,
    state,
    visibility,
    setVisibility,
    startSession,
    toggleTimer,
    resetTimer,
    addNote,
    addNpcMention,
    rollD20,
  } = useSession();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [npc, setNpc] = useState("");
  const [mod, setMod] = useState(0);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground shadow-[0_0_24px_rgba(226,69,69,0.35)] hover:bg-primary/90">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Modo sessão</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="chrome-panel max-w-4xl border-white/10 bg-card/90 p-0 text-left backdrop-blur">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Modo Sessão</DialogTitle>
          <DialogDescription>
            Timer, rolagens, NPCs e notas rápidas — tudo registrado no log da mesa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="chrome-panel border-white/10 bg-black/30">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  <CardTitle>Timer</CardTitle>
                </div>
                <Badge className="border-primary/25 bg-primary/10 text-primary">
                  {visibility === "players" ? "Visível aos jogadores" : "Só mestre"}
                </Badge>
              </div>
              <CardDescription>Controle rápido para encontros presenciais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-black tracking-tight">{formatElapsed(elapsedMs)}</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={state.startedAt ? toggleTimer : startSession}
                  className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
                >
                  {timerLabel}
                </Button>
                <Button variant="outline" onClick={resetTimer} disabled={!state.startedAt}>
                  Resetar
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
                <CardTitle>Atalhos rápidos</CardTitle>
                <Badge variant="outline" className="text-muted-foreground">
                  Log automático
                </Badge>
              </div>
              <CardDescription>Ações curtas que alimentam o log e os recentes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nota rápida</label>
                <div className="flex gap-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Registrar pista, decisão ou evento"
                  />
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
                  <Input
                    value={npc}
                    onChange={(e) => setNpc(e.target.value)}
                    placeholder="Nome do NPC"
                  />
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
                <label className="text-sm text-muted-foreground">Rolagem d20</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={mod}
                    onChange={(e) => setMod(Number(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Button
                    className="gap-2"
                    onClick={() => {
                      rollD20(mod);
                    }}
                  >
                    <Swords className="h-4 w-4" />
                    Rolar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="border-white/10" />

        <div className="max-h-72 overflow-y-auto px-6 pb-6">
          <div className="flex items-center justify-between py-4">
            <h3 className="text-sm uppercase tracking-[0.16em] text-primary">
              Log da sessão
            </h3>
            <Badge variant="outline" className="text-muted-foreground">
              {events.length} eventos
            </Badge>
          </div>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum evento registrado ainda. Comece a sessão ou adicione uma nota.
              </p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs capitalize text-primary"
                      >
                        {event.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[11px] uppercase tracking-[0.14em]"
                      >
                        {event.visibility === "players" ? "Mesa" : "Mestre"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                    <p className="text-sm text-foreground">{event.message}</p>
                  </div>
                  {event.payload?.roll ? (
                    <span className="text-sm font-semibold text-primary">
                      {event.payload.roll.total}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
