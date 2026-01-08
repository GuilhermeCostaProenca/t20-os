"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  NotebookPen,
  Plus,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CharacterCreateSchema } from "@/lib/validators";
import { Textarea } from "@/components/ui/textarea";
import { CombatPanel } from "@/components/combat/combat-panel";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  system: string;
  roomCode: string;
  createdAt: string;
  updatedAt: string;
};

type Character = {
  id: string;
  campaignId: string;
  name: string;
  role?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  level: number;
  createdAt: string;
  updatedAt: string;
};

const initialCharacter = {
  name: "",
  role: "",
  description: "",
  avatarUrl: "",
  level: 1,
};

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [form, setForm] = useState(initialCharacter);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sortedCharacters = useMemo(
    () =>
      [...characters].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [characters]
  );

  useEffect(() => {
    if (campaignId) {
      loadData(campaignId);
    }
  }, [campaignId]);

  async function loadData(id: string) {
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, characterRes] = await Promise.all([
        fetch("/api/campaigns", { cache: "no-store" }),
        fetch(`/api/campaigns/${id}/characters`, { cache: "no-store" }),
      ]);

      const campaignPayload = await campaignRes.json();
      if (!campaignRes.ok) {
        throw new Error(campaignPayload.error ?? "Erro ao buscar campanha");
      }
      const found: Campaign | undefined = (campaignPayload.data ?? []).find(
        (item: Campaign) => item.id === id
      );
      if (!found) {
        throw new Error("Campanha não encontrada");
      }
      setCampaign(found);

      const characterPayload = await characterRes.json();
      if (!characterRes.ok) {
        throw new Error(characterPayload.error ?? "Erro ao buscar personagens");
      }
      setCharacters(characterPayload.data ?? []);

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao carregar";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload.error ?? "Falha ao enviar imagem");
    }
    return payload.url as string;
  }

  async function handleAvatarUpload(file: File) {
    setFormError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar avatar";
      setFormError(message);
    } finally {
      setAvatarUploading(false);
    }
  }

  function openCreateCharacter() {
    setEditingCharacter(null);
    setForm(initialCharacter);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditCharacter(character: Character) {
    setEditingCharacter(character);
    setForm({
      name: character.name ?? "",
      role: character.role ?? "",
      description: character.description ?? "",
      avatarUrl: character.avatarUrl ?? "",
      level: character.level ?? 1,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSaveCharacter(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setFormError(null);
    const parsed = CharacterCreateSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Dados invalidos");
      return;
    }
    if (!campaignId) {
      setFormError("Campanha invalida");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingCharacter
        ? `/api/characters/${editingCharacter.id}`
        : `/api/campaigns/${campaignId}/characters`;
      const res = await fetch(endpoint, {
        method: editingCharacter ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Erro ao salvar personagem");
      }

      const saved: Character = payload.data ?? payload;
      setCharacters((prev) =>
        editingCharacter ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
      );
      setDialogOpen(false);
      setEditingCharacter(null);
      setForm(initialCharacter);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao salvar personagem";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCharacter(character: Character) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Remover personagem "${character.name}"?`);
      if (!ok) return;
    }
    try {
      const res = await fetch(`/api/characters/${character.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Erro ao remover personagem");
      }
      setCharacters((prev) => prev.filter((item) => item.id !== character.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover personagem";
      if (typeof window !== "undefined") window.alert(message);
    }
  }

  const loadingState = loading || !campaignId;

  if (loadingState) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <EmptyState
        title="Algo deu errado"
        description={error ?? "Campanha não encontrada"}
        action={
          <Button
            onClick={() => campaignId && loadData(campaignId)}
            className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
          >
            Tentar novamente
          </Button>
        }
        icon={<Swords className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="chrome-panel rounded-3xl border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              {campaign.system}
            </Badge>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">
              {campaign.description || "Sem descrição ainda. Adicione detalhes em breve."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-primary/30 text-primary">
              <Sparkles className="h-4 w-4" />
              Em breve: ficha rápida
            </Button>
            <Button
              variant="outline"
              className="border-primary/30 text-primary"
              onClick={() => campaignId && loadData(campaignId)}
            >
              Atualizar
            </Button>
          </div>
        </div>
        <Separator className="my-6 border-white/10" />
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">
              Personagens
            </div>
            <div className="text-xl font-semibold text-foreground">
              {characters.length} ativos
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">
              Sistema
            </div>
            <div className="text-xl font-semibold text-foreground">
              Tormenta 20
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">
              Room code
            </div>
            <div className="text-xl font-semibold text-foreground">
              {campaign.roomCode}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
            <div className="text-xs uppercase tracking-[0.18em] text-primary">
              Atualizada
            </div>
            <div className="text-xl font-semibold text-foreground">
              {new Date(campaign.updatedAt).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="characters" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="bg-white/5 text-foreground">
            <TabsTrigger value="characters">Personagens</TabsTrigger>
            <TabsTrigger value="npcs">NPCs</TabsTrigger>
            <TabsTrigger value="compendium">Compêndio</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="combat">Combate</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingCharacter(null);
                  setFormError(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="shadow-[0_0_24px_rgba(226,69,69,0.35)]"
                  onClick={openCreateCharacter}
                >
                  <Plus className="h-4 w-4" />
                  Novo personagem
                </Button>
              </DialogTrigger>
              <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                  <DialogTitle>
                    {editingCharacter ? "Editar personagem" : "Novo personagem"}
                  </DialogTitle>
                  <DialogDescription>
                    Nome, funcao curta e nivel (1 a 20) com validacao direta.
                  </DialogDescription>
                </DialogHeader>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSaveCharacter}>
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Nome
                      </label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Artoniano lendario"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Papel
                      </label>
                      <Input
                        value={form.role ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, role: e.target.value }))
                        }
                        placeholder="Guerreiro, Mago, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Nivel
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={form.level}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            level: Number(e.target.value) || 1,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Descricao curta
                      </label>
                      <Textarea
                        value={form.description ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Resumo rapido do personagem"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Avatar (opcional)
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={avatarUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleAvatarUpload(file);
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                      {form.avatarUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={form.avatarUrl}
                            alt={form.name || "Avatar"}
                            className="h-12 w-12 rounded-full border border-white/10 object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setForm((prev) => ({ ...prev, avatarUrl: "" }))}
                          >
                            Remover imagem
                          </Button>
                        </div>
                      ) : null}
                      {avatarUploading ? (
                        <p className="text-xs text-muted-foreground">Enviando imagem...</p>
                      ) : null}
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
                        className="text-muted-foreground"
                        onClick={() => setDialogOpen(false)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || avatarUploading}
                        className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
                      >
                        {submitting
                          ? "Salvando..."
                          : editingCharacter
                          ? "Salvar"
                          : "Criar personagem"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="characters" className="space-y-4">
          {sortedCharacters.length === 0 ? (
            <EmptyState
              title="Nenhum personagem ainda"
              description="Cadastre fichas para este grupo e acompanhe tudo em um só lugar."
              action={
                <Button onClick={openCreateCharacter}>
                  <Plus className="h-4 w-4" />
                  Novo personagem
                </Button>
              }
              icon={<Users className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedCharacters.map((character) => (
                <Link
                  key={character.id}
                  href={`/app/personagens/${character.id}`}
                  className="block"
                >
                  <Card className="chrome-panel group rounded-2xl border-white/10 bg-white/5 transition duration-150 hover:-translate-y-1 hover:border-primary/25">
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        {character.avatarUrl ? (
                          <img
                            src={character.avatarUrl}
                            alt={character.name}
                            className="h-12 w-12 rounded-full border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground">
                            {character.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{character.name}</CardTitle>
                          <CardDescription>
                            {character.role || "Sem papel definido"}
                          </CardDescription>
                          {character.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {character.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Badge className="border-primary/30 bg-primary/10 text-primary">
                        Nivel {character.level}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>
                          Atualizado{" "}
                          {new Date(character.updatedAt).toLocaleDateString("pt-BR")}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition duration-150 group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditCharacter(character);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleDeleteCharacter(character);
                          }}
                        >
                          Apagar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="npcs">
          <EmptyState
            title="NPCs em construção"
            description="Prepare fichas rápidas, notas e vínculos direto aqui."
            icon={<NotebookPen className="h-6 w-6" />}
          />
        </TabsContent>

        <TabsContent value="compendium">
          <EmptyState
            title="Compêndio em construção"
            description="Buscas instantâneas e referências rápidas chegam em breve."
            icon={<Sparkles className="h-6 w-6" />}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <EmptyState
            title="Sessoes em construcao"
            description="Log de sessao, cronologia e notas rapidas ficam prontos na proxima entrega."
            icon={<Swords className="h-6 w-6" />}
          />
        </TabsContent>

        <TabsContent value="combat">
          <CombatPanel
            campaignId={campaignId ?? ""}
            characters={characters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
