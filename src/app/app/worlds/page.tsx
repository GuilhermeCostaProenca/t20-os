"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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
import { WorldCreateSchema } from "@/lib/validators";

type World = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
};

const initialForm = {
  title: "",
  description: "",
  coverImage: "",
};

export default function WorldsPage() {
  const router = useRouter();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedWorlds = useMemo(
    () =>
      [...worlds].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [worlds]
  );

  useEffect(() => {
    loadWorlds();
  }, []);

  async function loadWorlds() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/worlds", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Não foi possível carregar mundos");
      }
      setWorlds(payload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar mundos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setFormError(null);
    const parsed = WorldCreateSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/worlds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Não foi possível criar o mundo");
      }

      setForm(initialForm);
      setDialogOpen(false);
      await loadWorlds();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao salvar mundo";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Mundos</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Universos vivos</h1>
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              World
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Gerencie os mundos canônicos e acompanhe campanhas e eventos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary/30 bg-white/5 text-primary"
            onClick={loadWorlds}
            disabled={loading}
          >
            <Sparkles className="h-4 w-4" />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
                <Plus className="h-4 w-4" />
                Novo mundo
              </Button>
            </DialogTrigger>
            <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                <DialogTitle>Novo mundo</DialogTitle>
                <DialogDescription>
                  Crie um universo base para suas campanhas e eventos.
                </DialogDescription>
              </DialogHeader>
              <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleCreate}>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                      placeholder="Ex.: Atlas de Arton"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Descrição</label>
                    <Textarea
                      placeholder="Breve resumo do mundo"
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Cover URL</label>
                    <Input
                      placeholder="Opcional: https://"
                      value={form.coverImage}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          coverImage: e.target.value,
                        }))
                      }
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
                      {submitting ? "Salvando..." : "Criar mundo"}
                    </Button>
                  </div>
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
            <Button
              onClick={loadWorlds}
              className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
            >
              Tentar novamente
            </Button>
          }
        />
      ) : sortedWorlds.length === 0 ? (
        <EmptyState
          title="Nenhum mundo ainda"
          description="Crie um mundo base para organizar campanhas e eventos."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo mundo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedWorlds.map((world) => (
            <Card
              key={world.id}
              className="chrome-panel group relative cursor-pointer rounded-2xl border-white/10 bg-white/5 transition duration-150 hover:-translate-y-1 hover:border-primary/25"
              onClick={() => router.push(`/app/worlds/${world.id}`)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="border-primary/25 bg-primary/10 text-primary">
                    Mundo
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Atualizado {new Date(world.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <CardTitle className="text-lg font-semibold">
                  {world.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {world.description || "Sem descrição no momento."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {world.coverImage ? "Capa definida" : "Sem capa"}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
