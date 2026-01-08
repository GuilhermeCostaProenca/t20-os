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
          <p className="text-muted-foreground">
            {world.description || "Sem descrição no momento."}
          </p>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
                <Plus className="h-4 w-4" />
                Nova campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                <DialogTitle>Nova campanha neste mundo</DialogTitle>
                <DialogDescription>
                  Crie uma campanha vinculada a este universo.
                </DialogDescription>
              </DialogHeader>
              <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleCreateCampaign}>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                      placeholder="Ex.: Era das Sombras"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Descrição</label>
                    <Textarea
                      placeholder="Breve contexto da campanha"
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                  {formError ? (
                    <p className="text-sm text-destructive">{formError}</p>
                  ) : null}
                </div>
                <div className="shrink-0 border-t border-white/10 px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setDialogOpen(false)}
                      className="text-muted-foreground"
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
                    >
                      {submitting ? "Salvando..." : "Criar campanha"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator className="border-white/10" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="chrome-panel border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            <CardDescription>Detalhes principais do mundo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge className="border-primary/25 bg-primary/10 text-primary">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Campanhas</span>
              <span>{sortedCampaigns.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Atualizado</span>
              <span>{new Date(world.updatedAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="chrome-panel border-white/10 bg-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Campanhas</CardTitle>
            <CardDescription>Recortes narrativos dentro do mundo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma campanha vinculada ainda.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {sortedCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => router.push(`/app/campaign/${campaign.id}`)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                  >
                    <span className="text-base font-semibold text-foreground">
                      {campaign.name}
                    </span>
                    <span className="flex items-center gap-2 text-xs">
                      <CalendarClock className="h-3 w-3" />
                      Atualizada em {new Date(campaign.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Últimos eventos</CardTitle>
          <CardDescription>
            Ledger unificado com eventos micro e macro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge className="border-white/10 bg-white/10 text-muted-foreground">
                      {event.type}
                    </Badge>
                    <Badge className="border-primary/20 bg-primary/10 text-primary">
                      {event.scope}
                    </Badge>
                    <span>{new Date(event.ts).toLocaleString("pt-BR")}</span>
                    <span>Visibilidade: {event.visibility}</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {event.text || "Evento registrado no ledger."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
