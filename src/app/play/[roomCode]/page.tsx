"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Cpu,
  Dna,
  Eye,
  History,
  Loader2,
  MessageSquare,
  Satellite,
  ScrollText,
  ShieldAlert,
  Signal,
  Skull,
  Sword,
  Target,
  User,
  Wifi,
  Zap
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  const [status, setStatus] = useState("Conectando...");
  const [isConnected, setIsConnected] = useState(false);
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
          setStatus("Erro de conexão");
          setIsConnected(false);
          return;
        }

        setIsConnected(true);
        setStatus("Sinal Estável");

        const data: Reveal | null = payload.data;
        if (data && data.id !== lastId) {
          setReveal(data);
          setLastId(data.id);
          setOpen(true);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setStatus("Sem sinal");
          setIsConnected(false);
        }
      }
    }
    const interval = setInterval(poll, 1500);
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
        setActionStatus("Falha ao sincronizar ficha");
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
      setActionStatus("Erro de sincronização");
    }
  }

  async function loadCampaign(code: string) {
    try {
      const res = await fetch(`/api/campaigns?roomCode=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok) return;
      const found = (payload.data ?? [])[0] as Campaign | undefined;
      if (!found) return;

      setCampaign(found);
      setCampaignId(found.id);
      await Promise.all([loadCharacters(found.id), loadCombatants(found.id)]);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCharacters(id: string) {
    try {
      const res = await fetch(`/api/campaigns/${id}/characters`, { cache: "no-store" });
      const payload = await res.json();
      if (res.ok) setCharacters(payload.data ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCombatants(id?: string) {
    const targetCampaignId = id ?? campaignId;
    if (!targetCampaignId) return;
    try {
      const res = await fetch(`/api/campaigns/${targetCampaignId}/combat`, { cache: "no-store" });
      const payload = await res.json();
      if (res.ok) {
        setCombatants(payload.data?.combatants ?? []);
        setCombatId(payload.data?.id ?? null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function executeAction() {
    const actorId = actorCombatant?.id;
    if (!campaignId || !actorId || !target) {
      setActionStatus("Parâmetros inválidos");
      return;
    }
    setActionStatus("Transmitindo comando...");
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
      if (!res.ok) throw new Error("Falha no servidor");
      setActionStatus("Comando executado");
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setActionStatus("Falha na transmissão");
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-primary/30">
      {/* Header / Status Bar */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Satellite className={cn("h-4 w-4", isConnected ? "text-primary animate-pulse" : "text-destructive")} />
            <span className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] border-white/10 bg-white/5">
              ROOM: {roomCode}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 space-y-6 pb-20">

        {/* Campaign Info */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white glow-text">
            {campaign?.name ?? "Sincronizando..."}
          </h1>
          <p className="text-sm text-zinc-400">Terminal do Jogador v2.0</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Active Reveal Card */}
          <Card className="col-span-full border-white/10 bg-zinc-900/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
                <Eye className="h-4 w-4 text-primary" /> Última Transmissão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reveal ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{reveal.title}</h3>
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(reveal.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {reveal.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-black">
                      <img src={reveal.imageUrl} alt={reveal.title} className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                  )}
                  {textContent && (
                    <div className="p-3 rounded-md bg-white/5 border border-white/5 text-sm text-zinc-300 leading-relaxed">
                      {textContent}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-600 gap-2">
                  <Signal className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Aguardando dados do mestre...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Module */}
          <Card className="col-span-full border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
                <Sword className="h-4 w-4 text-red-500" /> Módulo de Combate
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-500 hover:text-white"
                onClick={() => loadCombatants(campaignId)}
                disabled={!campaignId}
              >
                <History className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Identidade</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <select
                      className="w-full h-9 rounded-md border border-white/10 bg-black pl-9 pr-3 text-sm text-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                      value={selectedCharacterId}
                      onChange={(e) => setSelectedCharacterId(e.target.value)}
                    >
                      <option value="">Selecionar Agente...</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedCharacterId && !actorCombatant && (
                    <p className="text-xs text-yellow-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Fora de combate
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Alvo</label>
                  <div className="relative">
                    <Target className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <select
                      className="w-full h-9 rounded-md border border-white/10 bg-black pl-9 pr-3 text-sm text-zinc-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none appearance-none"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="">Selecionar Alvo...</option>
                      {combatants.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase">Ação Ofensiva</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-9 rounded-md border border-white/10 bg-black px-3 text-sm text-zinc-200 outline-none"
                    value={attackId}
                    onChange={(e) => setAttackId(e.target.value)}
                    disabled={!selectedCharacterId}
                  >
                    {attacks.length ? (
                      attacks.map((a) => (
                        <option key={a.id || a.name} value={a.id || a.name}>{a.name ?? "Ataque desconhecido"}</option>
                      ))
                    ) : (
                      <option value="">Ataque Padrão</option>
                    )}
                  </select>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    onClick={executeAction}
                    disabled={!actorCombatant || !target || !campaignId}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Executar
                  </Button>
                </div>
                {actionStatus && (
                  <p className="text-xs font-mono text-primary animate-pulse mt-2 text-center">
                    {">"} {actionStatus}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Lists */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/5 bg-zinc-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Dna className="h-3 w-3" /> Squad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32 pr-4">
                {characters.length ? (
                  <div className="space-y-2">
                    {characters.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                        <span className="text-zinc-300 font-medium">{c.name}</span>
                        <span className="text-xs text-zinc-600 font-mono">NEX {c.level}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">Nenhum agente.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-zinc-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Skull className="h-3 w-3" /> Ameaças Identificadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32 pr-4">
                {combatants.length ? (
                  <div className="space-y-2">
                    {combatants.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                        <span className={cn("font-medium", c.kind !== "CHARACTER" ? "text-red-400" : "text-blue-400")}>
                          {c.name}
                        </span>
                        <span className="text-xs text-zinc-600 font-mono">INIT {c.initiative}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">Sensores limpos.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Reveal Modal Overlay */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-primary/20 bg-black/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
              NOVA INTELIGÊNCIA RECEBIDA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Badge variant="outline" className="w-fit border-primary/20 text-primary uppercase tracking-widest text-[10px]">
              {reveal?.type ?? "DADOS"}
            </Badge>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{reveal?.title}</h2>

            {reveal?.imageUrl && (
              <div className="rounded-lg border border-white/10 overflow-hidden bg-zinc-900">
                <img src={reveal.imageUrl} alt="Reveal" className="w-full h-auto max-h-[60vh] object-contain" />
              </div>
            )}

            {textContent && (
              <p className="text-zinc-300 leading-relaxed border-l-2 border-primary/20 pl-4">
                {textContent}
              </p>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t border-white/10">
            <Button onClick={ackReveal} className="bg-primary text-black hover:bg-primary/90 font-bold tracking-wide">
              CONFIRMAR LEITURA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
