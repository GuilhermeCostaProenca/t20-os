"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

type Campaign = {
  id: string;
  name: string;
  roomCode: string;
};

type Character = {
  id: string;
  name: string;
  role?: string | null;
  level: number;
};

export default function PlayRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params?.roomCode?.toString().toUpperCase();
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Conectado a mesa");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [combatId, setCombatId] = useState<string | null>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const [actor, setActor] = useState("");
  const [target, setTarget] = useState("");
  const [actionKind, setActionKind] = useState<"ATTACK" | "SPELL" | "SKILL">("ATTACK");
  const [attackId, setAttackId] = useState("");
  const [actionStatus, setActionStatus] = useState<string | null>(null);

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
          setStatus("Novo reveal disponivel");
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

  useEffect(() => {
    if (!roomCode) return;
    loadCampaign(roomCode);
  }, [roomCode]);

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

  async function loadCampaign(code: string) {
    setStatus("Carregando campanha...");
    try {
      const res = await fetch(`/api/campaigns?roomCode=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error ?? "Erro ao carregar campanha");
        return;
      }
      const found = (payload.data ?? [])[0] as Campaign | undefined;
      if (!found) {
        setStatus("Campanha nao encontrada");
        return;
      }
      setCampaign(found);
      setCampaignId(found.id);
      setStatus("Campanha carregada");
      await Promise.all([loadCharacters(found.id), loadCombatants(found.id)]);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao carregar campanha");
    }
  }

  async function loadCharacters(id: string) {
    try {
      const res = await fetch(`/api/campaigns/${id}/characters`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setActionStatus(payload.error ?? "Erro ao carregar personagens");
        return;
      }
      setCharacters(payload.data ?? []);
    } catch (err) {
      console.error(err);
      setActionStatus("Erro ao carregar personagens");
    }
  }

  async function loadCombatants(id?: string) {
    const targetCampaignId = id ?? campaignId;
    if (!targetCampaignId) return;
    try {
      const res = await fetch(`/api/campaigns/${targetCampaignId}/combat`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setActionStatus(payload.error ?? "Erro ao carregar combate");
        return;
      }
      setCombatants(payload.data?.combatants ?? []);
      setCombatId(payload.data?.id ?? null);
      setActionStatus("Combate carregado");
    } catch (err) {
      console.error(err);
      setActionStatus("Erro ao carregar combate");
    }
  }

  async function executeAction() {
    if (!campaignId || !actor || !target) {
      setActionStatus("Selecione personagem e alvo");
      return;
    }
    setActionStatus("Enviando acao...");
    try {
      const res = await fetch(`/api/play/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          actorId: actor,
          targetId: target,
          campaignId,
          combatId: combatId ?? undefined,
          type: actionKind,
          payload: { attackId: attackId || undefined },
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Erro na acao");
      setActionStatus("Acao enviada");
    } catch (err) {
      console.error(err);
      setActionStatus("Erro ao enviar acao");
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
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{campaign?.name ?? "Campanha"}</CardTitle>
              <CardDescription>
                {campaign ? `Room code: ${campaign.roomCode}` : "Carregando campanha..."}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => campaignId && Promise.all([loadCharacters(campaignId), loadCombatants(campaignId)])}
              disabled={!campaignId}
            >
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Personagens</p>
              {characters.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {characters.map((character) => (
                    <li key={character.id}>
                      {character.name} {character.role ? `- ${character.role}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum personagem cadastrado.</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Combatentes</p>
              {combatants.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {combatants.map((combatant) => (
                    <li key={combatant.id}>{combatant.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Combate ainda nao iniciado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="chrome-panel border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Revelacoes</CardTitle>
            <CardDescription>Quando o mestre revelar algo, aparece aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            {reveal ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ultimo: {reveal.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reveal.createdAt).toLocaleTimeString("pt-BR")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aguardando revelacao...</p>
            )}
          </CardContent>
        </Card>

        <Card className="chrome-panel border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Enviar acao</CardTitle>
            <CardDescription>Atacar / Magia / Pericia via ficha.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadCombatants()} disabled={!campaignId}>
                Atualizar combate
              </Button>
              <select
                className="h-10 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                value={actionKind}
                onChange={(e) => setActionKind(e.target.value as any)}
              >
                <option value="ATTACK">Ataque</option>
                <option value="SPELL" disabled>
                  Magia (em breve)
                </option>
                <option value="SKILL" disabled>
                  Pericia (em breve)
                </option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
              >
                <option value="">Ator</option>
                {combatants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Alvo</option>
                {combatants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Attack ID (opcional, da ficha)"
              value={attackId}
              onChange={(e) => setAttackId(e.target.value)}
            />
            <Button className="w-full" onClick={executeAction} disabled={!actor || !target || !campaignId}>
              Enviar acao
            </Button>
            {actionStatus ? <p className="text-xs text-muted-foreground">{actionStatus}</p> : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-white/10 bg-background/95 text-left">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className="border-primary/25 bg-primary/10 text-primary capitalize">{reveal?.type}</Badge>
              {reveal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reveal?.imageUrl ? (
              <img src={reveal.imageUrl} alt={reveal.title} className="w-full rounded-lg border border-white/10 object-cover" />
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
