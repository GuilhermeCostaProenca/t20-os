"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [attacks, setAttacks] = useState<any[]>([]);
  const [target, setTarget] = useState("");
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

  const actorCombatant = useMemo(() => {
    if (!selectedCharacterId) return null;
    return combatants.find((combatant) => combatant.refId === selectedCharacterId) ?? null;
  }, [combatants, selectedCharacterId]);

  useEffect(() => {
    if (!selectedCharacterId) {
      setAttacks([]);
      setAttackId("");
      return;
    }
    loadCharacterSheet(selectedCharacterId);
  }, [selectedCharacterId]);

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

  async function loadCharacterSheet(id: string) {
    try {
      const res = await fetch(`/api/characters/${id}/sheet`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setActionStatus(payload.error ?? "Erro ao carregar ficha");
        return;
      }
      const list = Array.isArray(payload.data?.attacks) ? payload.data.attacks : [];
      setAttacks(list);
      if (list.length) {
        setAttackId(list[0].id || list[0].name || "");
      } else {
        setAttackId("");
      }
    } catch (err) {
      console.error(err);
      setActionStatus("Erro ao carregar ficha");
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
    const actorId = actorCombatant?.id;
    if (!campaignId || !actorId || !target) {
      setActionStatus("Selecione personagem, alvo e combate valido");
      return;
    }
    setActionStatus("Enviando acao...");
    try {
      const res = await fetch(`/api/play/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          actorId,
          targetId: target,
          campaignId,
          combatId: combatId ?? undefined,
          type: "ATTACK",
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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => loadCombatants()} disabled={!campaignId}>
                Atualizar combate
              </Button>
              {actorCombatant ? (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Ator: {actorCombatant.name}
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Seu personagem</label>
                <select
                  className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                  value={selectedCharacterId}
                  onChange={(e) => setSelectedCharacterId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
                {selectedCharacterId && !actorCombatant ? (
                  <p className="text-xs text-muted-foreground">
                    Seu personagem ainda nao entrou no combate.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Alvo</label>
                <select
                  className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {combatants.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Ataque da ficha</label>
              <select
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                value={attackId}
                onChange={(e) => setAttackId(e.target.value)}
                disabled={!selectedCharacterId}
              >
                {attacks.length ? (
                  attacks.map((attack) => (
                    <option key={attack.id || attack.name} value={attack.id || attack.name}>
                      {attack.name ?? "Ataque"}
                    </option>
                  ))
                ) : (
                  <option value="">Ataque basico</option>
                )}
              </select>
            </div>
            <Button
              className="w-full"
              onClick={executeAction}
              disabled={!actorCombatant || !target || !campaignId}
            >
              Enviar acao
            </Button>
            {actionStatus ? <p className="text-xs text-muted-foreground">{actionStatus}</p> : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-lg flex-col overflow-hidden border-white/10 bg-background/95 p-0 text-left">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Badge className="border-primary/25 bg-primary/10 text-primary capitalize">{reveal?.type}</Badge>
              {reveal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
            {reveal?.imageUrl ? (
              <img src={reveal.imageUrl} alt={reveal.title} className="w-full rounded-lg border border-white/10 object-cover" />
            ) : null}
            {textContent ? <p className="text-sm text-foreground">{textContent}</p> : null}
          </div>
          <div className="shrink-0 border-t border-white/10 px-6 py-4">
            <Button className="w-full" onClick={ackReveal}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
