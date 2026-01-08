"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Sparkles, Swords } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CampaignCreateSchema } from "@/lib/validators";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  system: string;
  createdAt: string;
  updatedAt: string;
};

const initialForm = {
  name: "",
  description: "",
};

export default function DashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedCampaigns = useMemo(
    () =>
      [...campaigns].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [campaigns]
  );

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Não foi possível carregar campanhas");
      }
      setCampaigns(payload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar campanhas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event?: FormEvent<HTMLFormElement>) {
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
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Não foi possível criar a campanha");
      }

      setForm(initialForm);
      setDialogOpen(false);
      await loadCampaigns();
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">
            Painel
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              Tormenta 20
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Crie, organize e navegue entre suas campanhas da mesa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary/30 bg-white/5 text-primary"
            onClick={loadCampaigns}
            disabled={loading}
          >
            <Sparkles className="h-4 w-4" />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
                <Plus className="h-4 w-4" />
                Nova campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="chrome-panel border-white/10 bg-card/80 backdrop-blur">
              <DialogHeader>
                <DialogTitle>Nova campanha</DialogTitle>
                <DialogDescription>
                  Defina um nome épico e uma descrição curta. Validamos os
                  campos automaticamente.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nome
                  </label>
                  <Input
                    placeholder="Ex.: Fortaleza de Valkaria"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Descrição
                  </label>
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
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator className="border-white/10" />

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="chrome-panel h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Falha ao carregar"
          description={error}
          action={
            <Button onClick={loadCampaigns} className="shadow-[0_0_18px_rgba(226,69,69,0.3)]">
              Tentar novamente
            </Button>
          }
          icon={<Swords className="h-6 w-6" />}
        />
      ) : sortedCampaigns.length === 0 ? (
        <EmptyState
          title="Nenhuma campanha ainda"
          description="Crie sua primeira campanha e comece a operar sua mesa."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova campanha
            </Button>
          }
          icon={<Swords className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="chrome-panel group relative cursor-pointer rounded-2xl border-white/10 bg-white/5 transition duration-150 hover:-translate-y-1 hover:border-primary/25"
              onClick={() => router.push(`/app/campaign/${campaign.id}`)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="border-primary/25 bg-primary/10 text-primary">
                    {campaign.system}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition duration-150 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">
                  {campaign.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {campaign.description || "Sem descrição no momento."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Atualizada {new Date(campaign.updatedAt).toLocaleDateString("pt-BR")}</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(226,69,69,0.5)]" />
                  Pronta
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
