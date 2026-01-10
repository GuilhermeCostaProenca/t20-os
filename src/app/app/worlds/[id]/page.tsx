"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarClock, Plus, RefreshCw, Trash, MapPin,
  Book, Users, Activity, Globe, ChevronRight, Settings,
  Sword, Scroll, LayoutDashboard, Map as MapIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignCreateSchema } from "@/lib/validators";
import { Skeleton } from "@/components/ui/skeleton";

const initialForm = {
  name: "",
  description: "",
};

type WorldCampaign = {
  id: string;
  name: string;
  updatedAt: string;
};

type WorldStats = {
  locations: number;
  rules: number;
  npcs: number;
  sessions: number;
};

type NextSession = {
  id: string;
  title: string;
  scheduledAt: string;
  campaign: { name: string };
};

type World = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  campaigns: WorldCampaign[];
  stats: WorldStats;
  nextSession?: NextSession | null;
};

type WorldEvent = {
  id: string;
  type: string;
  scope: string;
  ts: string;
  text?: string | null;
  visibility: string;
  payload?: any;
};

export default function WorldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params?.id as string;

  const [world, setWorld] = useState<World | null>(null);
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (worldId) loadWorld();
  }, [worldId]);

  async function loadWorld() {
    setLoading(true);
    try {
      const [worldRes, eventsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}`, { cache: "no-store" }),
        fetch(`/api/worlds/${worldId}/events?limit=10`, { cache: "no-store" }),
      ]);

      const wPayload = await worldRes.json();
      const ePayload = await eventsRes.json();

      if (worldRes.ok) setWorld(wPayload.data);
      if (eventsRes.ok) setEvents(ePayload.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e: FormEvent) {
    e.preventDefault();
    try {
      const parsed = CampaignCreateSchema.parse({ ...form, worldId });
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error("Erro ao criar campanha");
      setForm(initialForm);
      setDialogOpen(false);
      await loadWorld();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao salvar campanha";
      alert(message);
    }
  }

  function formatEvent(evt: WorldEvent) {
    if (evt.text) return evt.text;

    const p = evt.payload || {};
    switch (evt.type) {
      case 'WORLD_CREATED': return `Mundo criado: ${p.title || 'Sem título'}`;
      case 'CAMPAIGN_CREATED': return `Nova campanha: ${p.name || 'Sem nome'}`;
      case 'CHARACTER_CREATED': return `Novo personagem: ${p.name || 'Sem nome'}`;
      case 'NOTE': return "Anotação silenciosa";
      case 'ROLL_DICE': return "Rolagem de dados";
      case 'ATTACK': return "Registro de combate";
      default: return `${evt.type.replace(/_/g, " ")} (Sistema)`;
    }
  }

  async function handleArchiveWorld() {
    if (!confirm("Arquivar mundo?")) return;
    await fetch(`/api/worlds/${worldId}`, { method: 'DELETE' });
    router.push("/app");
  }

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!world) return <div className="p-8">Mundo não encontrado</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-red-950/50 to-black p-8 sm:p-12">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-950/30 backdrop-blur-sm">
                {world.status}
              </Badge>
              <span className="text-xs text-white/40 font-mono tracking-widest uppercase">ID: {world.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              {world.title}
            </h1>
            <p className="text-white/60 max-w-2xl leading-relaxed">
              {world.description || "Um universo esperando para ser explorado..."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10" onClick={loadWorld}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20">
                  <Plus className="mr-2 h-4 w-4" /> Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Nova Campanha</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <Input placeholder="Nome da Campanha" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <Input placeholder="Descrição Curta" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  <Button type="submit" className="w-full">Criar Jornada</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="cockpit" className="space-y-6">
        <TabsList className="bg-black/40 border border-white/10 p-1">
          <TabsTrigger value="cockpit" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2"><Activity className="h-4 w-4" /> Linha do Tempo</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="cockpit" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10 hover:border-red-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas</CardTitle>
                <Globe className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{world.campaigns?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Mundos ativos</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">NPCs</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{world.stats?.npcs || 0}</div>
                <p className="text-xs text-muted-foreground">Habitantes</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-green-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Locais</CardTitle>
                <MapPin className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{world.stats?.locations || 0}</div>
                <p className="text-xs text-muted-foreground">Pontos de interesse</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-amber-500/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sessões</CardTitle>
                <Book className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{world.stats?.sessions || 0}</div>
                <p className="text-xs text-muted-foreground">Histórias contadas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Next Session Hero */}
              {world.nextSession && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-950/40 to-black border border-amber-900/30 p-6 flex items-center justify-between shadow-lg shadow-amber-900/5 group hover:border-amber-500/40 transition-all">

                  <div className="z-10 space-y-1">
                    <div className="text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <CalendarClock className="h-3 w-3" /> Próxima Sessão
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-100 transition-colors">
                      {world.nextSession.title}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {new Date(world.nextSession.scheduledAt).toLocaleString()} • {world.nextSession.campaign.name}
                    </p>
                  </div>
                  <Button size="sm" className="z-10 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 border border-amber-500/30">
                    Ver Detalhes
                  </Button>
                </div>
              )}

              {/* Campaigns Grid */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sword className="h-4 w-4 text-primary" /> Campanhas Ativas
                </h3>
                {world.campaigns?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-muted-foreground mb-2">O mundo está silencioso.</p>
                    <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>Criar Primeira Campanha</Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {world.campaigns?.map(c => (
                      <div key={c.id}
                        onClick={() => router.push(`/app/campaign/${c.id}`)}
                        className="group relative flex flex-col p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-primary/40 transition-all cursor-pointer overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-white/50" />
                        </div>
                        <span className="font-bold text-white text-lg mb-1">{c.name}</span>
                        <span className="text-xs text-white/40">Atualizado: {new Date(c.updatedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity Mini */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" /> Atividade Recente
                </h3>
                <div className="space-y-2">
                  {events.slice(0, 5).map(evt => (
                    <div key={evt.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5 text-sm">
                      <div className="h-2 w-2 rounded-full bg-slate-500/50" />
                      <span className="font-mono text-white/30 text-xs">
                        {new Date(evt.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex-1 text-white/80 truncate">
                        {formatEvent(evt)}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-white/5 text-white/30 border-none">{evt.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              <Card className="bg-zinc-950 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mundo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white" onClick={() => router.push(`/app/worlds/${worldId}/map`)}>
                    <MapIcon className="mr-2 h-4 w-4" /> Atlas Interativo
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white" onClick={() => router.push(`/app/worlds/${worldId}/npcs`)}>
                    <Users className="mr-2 h-4 w-4" /> Bestiário
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white" onClick={() => router.push(`/app/worlds/${worldId}/locations`)}>
                    <MapPin className="mr-2 h-4 w-4" /> Locais
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white" onClick={() => router.push(`/app/worlds/${worldId}/compendium`)}>
                    <Book className="mr-2 h-4 w-4" /> Compêndio
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white" onClick={() => router.push(`/app/worlds/${worldId}/diary`)}>
                    <CalendarClock className="mr-2 h-4 w-4" /> Diário
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-b from-blue-950/20 to-transparent border-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-sm text-blue-400">Dica do Mestre</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-200/60 leading-relaxed">
                  Mantenha o diário atualizado para que a IA possa gerar resumos precisos das sessões anteriores.
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-muted-foreground mb-4">Registro completo de eventos do mundo.</p>
            <div className="space-y-2">
              {events.map(evt => (
                <div key={evt.id} className="flex gap-4 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="font-mono text-xs text-white/40 min-w-[50px]">{new Date(evt.ts).toLocaleTimeString()}</div>
                  <div className="flex-1">
                    <div className="text-sm text-white/90">{formatEvent(evt)}</div>
                    <div className="text-xs text-white/30 mt-1 flex gap-2">
                      <span>{evt.type}</span>
                      <span>•</span>
                      <span>{evt.scope}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border-red-900/30 bg-red-950/10">
            <CardHeader>
              <CardTitle className="text-red-400">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleArchiveWorld}>
                <Trash className="mr-2 h-4 w-4" /> Arquivar Mundo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
