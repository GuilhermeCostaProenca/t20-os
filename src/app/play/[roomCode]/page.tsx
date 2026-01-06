"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type Reveal = {
  id: string;
  roomCode: string;
  type: string;
  title: string;
  content: any;
  imageUrl?: string | null;
  visibility: string;
  createdAt: string;
};

export default function PlayRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params?.roomCode?.toString().toUpperCase();
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Conectado à mesa");

  useEffect(() => {
    let active = true;
    async function poll() {
      if (!roomCode) return;
      try {
        const res = await fetch(`/api/reveal?roomCode=${roomCode}`, { cache: "no-store" });
        const payload = await res.json();
        if (!active) return;
        if (!res.ok) {
          setStatus(payload.error ?? "Erro ao conectar");
          return;
        }
        const data: Reveal | null = payload.data;
        if (data && data.id !== lastId) {
          setReveal(data);
          setLastId(data.id);
          setOpen(true);
          setStatus("Novo reveal disponível");
        }
      } catch (err) {
        console.error(err);
        if (active) setStatus("Erro ao conectar");
      }
    }
    const interval = setInterval(poll, 1000);
    poll();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [roomCode, lastId]);

  const textContent = useMemo(() => {
    if (!reveal) return "";
    if (typeof reveal.content === "string") return reveal.content;
    if (reveal.content?.text) return reveal.content.text;
    return "";
  }, [reveal]);

  async function ackReveal() {
    if (!reveal) return;
    try {
      await fetch("/api/reveal/ack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reveal.id, roomCode }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Modo Jogador</p>
            <h1 className="text-2xl font-bold">Sala {roomCode}</h1>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
          <Badge className="border-primary/25 bg-primary/10 text-primary">Conectado</Badge>
        </div>

        <Card className="chrome-panel border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Revelações</CardTitle>
            <CardDescription>Quando o mestre revelar algo, aparece aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            {reveal ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Último: {reveal.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reveal.createdAt).toLocaleTimeString("pt-BR")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aguardando revelação...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-white/10 bg-background/95 text-left">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className="border-primary/25 bg-primary/10 text-primary capitalize">
                {reveal?.type}
              </Badge>
              {reveal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reveal?.imageUrl ? (
              <img
                src={reveal.imageUrl}
                alt={reveal.title}
                className="w-full rounded-lg border border-white/10 object-cover"
              />
            ) : null}
            {textContent ? <p className="text-sm text-foreground">{textContent}</p> : null}
            <Separator className="border-white/10" />
            <Button className="w-full" onClick={ackReveal}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
