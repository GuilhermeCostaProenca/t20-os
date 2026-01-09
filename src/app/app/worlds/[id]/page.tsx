"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarClock, Plus, RefreshCw } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

import { CampaignCreateSchema } from "@/lib/validators";

const initialForm = {
  name: "",
  description: "",
};

type WorldCampaign = {
  id: string;
  name: string;
  updatedAt: string;
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
};

type WorldEvent = {
  id: string;
  type: string;
  scope: string;
  ts: string;
  text?: string | null;
  visibility: string;
};

export default function WorldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params?.id as string;

  const [world, setWorld] = useState<World | null>(null);
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedCampaigns = useMemo(
    () =>
      world?.campaigns
        ? [...world.campaigns].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        )
        : [],
    [world?.campaigns]
  );

  useEffect(() => {
    if (worldId) {
      loadWorld();
    }
  }, [worldId]);

  async function loadWorld() {
    setLoading(true);
    setError(null);
    try {
      const [worldRes, eventsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}`, { cache: "no-store" }),
        fetch(`/api/worlds/${worldId}/events`, { cache: "no-store" }),
      ]);

      const worldPayload = await worldRes.json().catch(() => ({}));
      if (!worldRes.ok) {
        throw new Error(worldPayload.error ?? "Não foi possível carregar o mundo");
      }

      const eventsPayload = await eventsRes.json().catch(() => ({}));
      if (!eventsRes.ok) {
        throw new Error(eventsPayload.error ?? "Não foi possível carregar eventos");
      }

      setWorld(worldPayload.data ?? null);
      setEvents(eventsPayload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar mundo";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setFormError(null);
    const parsed = CampaignCreateSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, worldId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Não foi possível criar a campanha");
      }

      setForm(initialForm);
      setDialogOpen(false);
      await loadWorld();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao salvar campanha";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div
            key={idx}
            className="chrome-panel h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error ?? "Mundo não encontrado."}</p>
        <Button onClick={() => router.push("/app/worlds")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Mundo</p>
          <h1 className="text-3xl font-bold">{world.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={world.status === 'ACTIVE' ? "text-green-400 border-green-400/30" : "text-yellow-400 border-yellow-400/30"}>
              {world.status}
            </Badge>
            <p className="text-muted-foreground">
              {world.description || "Sem descrição no momento."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary/30 bg-white/5 text-primary"
            onClick={loadWorld}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          {/* Create Campaign Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
                <Plus className="h-4 w-4" />
                Nova campanha
              </Button>
            </DialogTrigger>
            {/* ... Dialog Content ... */}
          </Dialog>
        </div>
      </div>

      <Separator className="border-white/10" />

      <Tabs defaultValue="cockpit" className="space-y-4">
        <TabsList className="bg-black/40 border border-white/10">
          <TabsTrigger value="cockpit">Visão Geral (Estado)</TabsTrigger>
          <TabsTrigger value="history">Linha do Tempo (Ledger)</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="cockpit" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="chrome-panel border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Campanhas</span>
                  <span>{sortedCampaigns.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="chrome-panel border-white/10 bg-white/5 lg:col-span-2">
              <CardHeader>
                <CardTitle>Campanhas Ativas</CardTitle>
                <CardDescription>Projeções narrativas atuais.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Campaign List */}
                {sortedCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma campanha.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sortedCampaigns.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => router.push(`/app/campaign/${c.id}`)} // Should redirect to world-scoped campaign path?
                        className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-primary/30"
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-xs text-muted-foreground">Atualizado em {new Date(c.updatedAt).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="chrome-panel border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Ledger de Eventos</CardTitle>
              <CardDescription>Registro imutável de todas as alterações neste mundo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{event.type}</Badge>
                      <Badge className={event.scope === 'MACRO' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}>{event.scope}</Badge>
                      <span>{new Date(event.ts).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{event.text || "Evento registrado."}</p>
                  </div>
                ))}
                {events.length === 0 && <p className="text-muted-foreground text-sm">Nenhum evento.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" /> Zona de Perigo
              </CardTitle>
              <CardDescription>Ações destrutivas e irreversíveis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>Arquivar Mundo (Em Breve)</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
