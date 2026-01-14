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
import {
  CharacterCreateSchema,
  NpcCreateSchema,
  SessionCreateSchema,
} from "@/lib/validators";
import { Textarea } from "@/components/ui/textarea";
import { CombatPanel } from "@/components/combat/combat-panel";
import { AgentCard } from "@/components/dashboard/agent-card";
import { NpcCard } from "@/components/dashboard/npc-card";

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
  ancestry?: string | null;
  className?: string | null;
  role?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  level: number;
  createdAt: string;
  updatedAt: string;
};

type Session = {
  id: string;
  campaignId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  scheduledAt?: string | null;
  status?: "planned" | "active" | "finished";
  createdAt: string;
  updatedAt: string;
};

type Npc = {
  id: string;
  campaignId: string;
  name: string;
  type: "npc" | "enemy";
  hpMax: number;
  defenseFinal: number;
  damageFormula: string;
  description?: string | null;
  tags?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

const initialCharacter = {
  name: "",
  ancestry: "",
  className: "",
  role: "",
  description: "",
  avatarUrl: "",
  level: 1,
};

function toDatetimeLocal(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

const initialSession = {
  title: "",
  description: "",
  scheduledAt: toDatetimeLocal(new Date()),
  coverUrl: "",
  status: "planned",
};

const initialNpc = {
  name: "",
  type: "npc" as "npc" | "enemy",
  hpMax: 1,
  defenseFinal: 10,
  damageFormula: "1d6",
  description: "",
  tags: "",
  imageUrl: "",
};

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [form, setForm] = useState(initialCharacter);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionForm, setSessionForm] = useState(initialSession);
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);
  const [sessionUploading, setSessionUploading] = useState(false);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null);
  const [npcForm, setNpcForm] = useState(initialNpc);
  const [npcFormError, setNpcFormError] = useState<string | null>(null);
  const [npcUploading, setNpcUploading] = useState(false);
  const [npcSubmitting, setNpcSubmitting] = useState(false);

  const sortedCharacters = useMemo(
    () =>
      [...characters].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [characters]
  );

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const aDate = new Date(a.scheduledAt ?? a.updatedAt).getTime();
        const bDate = new Date(b.scheduledAt ?? b.updatedAt).getTime();
        return bDate - aDate;
      }),
    [sessions]
  );

  const sortedNpcs = useMemo(
    () =>
      [...npcs].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [npcs]
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
      const [campaignRes, characterRes, sessionRes, npcRes] = await Promise.all([
        fetch("/api/campaigns", { cache: "no-store" }),
        fetch(`/api/campaigns/${id}/characters`, { cache: "no-store" }),
        fetch(`/api/campaigns/${id}/sessions`, { cache: "no-store" }),
        fetch(`/api/campaigns/${id}/npcs`, { cache: "no-store" }),
      ]);

      const campaignPayload = await campaignRes.json();
      if (!campaignRes.ok) {
        throw new Error(campaignPayload.error ?? "Erro ao buscar campanha");
      }
      const found: Campaign | undefined = (campaignPayload.data ?? []).find(
        (item: Campaign) => item.id === id
      );
      if (!found) {
        throw new Error("Campanha nÃ£o encontrada");
      }
      setCampaign(found);

      const characterPayload = await characterRes.json();
      if (!characterRes.ok) {
        throw new Error(characterPayload.error ?? "Erro ao buscar personagens");
      }
      setCharacters(characterPayload.data ?? []);

      const sessionPayload = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionPayload.error ?? "Erro ao buscar sessoes");
      }
      setSessions(sessionPayload.data ?? []);

      const npcPayload = await npcRes.json();
      if (!npcRes.ok) {
        throw new Error(npcPayload.error ?? "Erro ao buscar NPCs");
      }
      setNpcs(npcPayload.data ?? []);

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

  async function handleCoverUpload(file: File) {
    setSessionFormError(null);
    setSessionUploading(true);
    try {
      const url = await uploadImage(file);
      setSessionForm((prev) => ({ ...prev, coverUrl: url }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar imagem";
      setSessionFormError(message);
    } finally {
      setSessionUploading(false);
    }
  }

  async function handleNpcUpload(file: File) {
    setNpcFormError(null);
    setNpcUploading(true);
    try {
      const url = await uploadImage(file);
      setNpcForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar imagem";
      setNpcFormError(message);
    } finally {
      setNpcUploading(false);
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
      ancestry: character.ancestry ?? "",
      className: character.className ?? "",
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

  function openCreateSession() {
    setEditingSession(null);
    setSessionForm({ ...initialSession, scheduledAt: toDatetimeLocal(new Date()) });
    setSessionFormError(null);
    setSessionDialogOpen(true);
  }

  function openEditSession(session: Session) {
    setEditingSession(session);
    setSessionForm({
      title: session.title ?? "",
      description: session.description ?? "",
      scheduledAt: toDatetimeLocal(session.scheduledAt),
      coverUrl: session.coverUrl ?? "",
      status: session.status ?? "planned",
    });
    setSessionFormError(null);
    setSessionDialogOpen(true);
  }

  async function handleSaveSession(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSessionFormError(null);
    const scheduledAt = sessionForm.scheduledAt ? new Date(sessionForm.scheduledAt) : null;
    if (sessionForm.scheduledAt && Number.isNaN(scheduledAt?.getTime())) {
      setSessionFormError("Data invalida");
      return;
    }
    const parsed = SessionCreateSchema.safeParse({
      title: sessionForm.title,
      description: sessionForm.description,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
      coverUrl: sessionForm.coverUrl,
      status: sessionForm.status,
    });
    if (!parsed.success) {
      setSessionFormError(parsed.error.issues[0]?.message ?? "Dados invalidos");
      return;
    }
    if (!campaignId) {
      setSessionFormError("Campanha invalida");
      return;
    }

    setSessionSubmitting(true);
    try {
      const endpoint = editingSession
        ? `/api/sessions/${editingSession.id}`
        : `/api/campaigns/${campaignId}/sessions`;
      const res = await fetch(endpoint, {
        method: editingSession ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Erro ao salvar sessao");
      }

      const saved: Session = payload.data ?? payload;
      setSessions((prev) =>
        editingSession ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
      );
      setSessionDialogOpen(false);
      setEditingSession(null);
      setSessionForm(initialSession);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao salvar sessao";
      setSessionFormError(message);
    } finally {
      setSessionSubmitting(false);
    }
  }

  async function handleDeleteSession(session: Session) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Remover sessao "${session.title}"?`);
      if (!ok) return;
    }
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Erro ao remover sessao");
      }
      setSessions((prev) => prev.filter((item) => item.id !== session.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover sessao";
      if (typeof window !== "undefined") window.alert(message);
    }
  }

  function openSessionMode(session: Session) {
    if (typeof window === "undefined") return;
    localStorage.setItem("t20-session-id", session.id);
    window.dispatchEvent(new CustomEvent("t20-open-session"));
  }

  function openCreateNpc() {
    setEditingNpc(null);
    setNpcForm(initialNpc);
    setNpcFormError(null);
    setNpcDialogOpen(true);
  }

  function openEditNpc(npc: Npc) {
    setEditingNpc(npc);
    setNpcForm({
      name: npc.name ?? "",
      type: npc.type ?? "npc",
      hpMax: npc.hpMax ?? 1,
      defenseFinal: npc.defenseFinal ?? 10,
      damageFormula: npc.damageFormula ?? "1d6",
      description: npc.description ?? "",
      tags: npc.tags ?? "",
      imageUrl: npc.imageUrl ?? "",
    });
    setNpcFormError(null);
    setNpcDialogOpen(true);
  }

  async function handleSaveNpc(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setNpcFormError(null);
    const parsed = NpcCreateSchema.safeParse(npcForm);
    if (!parsed.success) {
      setNpcFormError(parsed.error.issues[0]?.message ?? "Dados invalidos");
      return;
    }
    if (!campaignId) {
      setNpcFormError("Campanha invalida");
      return;
    }

    setNpcSubmitting(true);
    try {
      const endpoint = editingNpc
        ? `/api/npcs/${editingNpc.id}`
        : `/api/campaigns/${campaignId}/npcs`;
      const res = await fetch(endpoint, {
        method: editingNpc ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Erro ao salvar NPC");
      }

      const saved: Npc = payload.data ?? payload;
      setNpcs((prev) =>
        editingNpc ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
      );
      setNpcDialogOpen(false);
      setEditingNpc(null);
      setNpcForm(initialNpc);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao salvar NPC";
      setNpcFormError(message);
    } finally {
      setNpcSubmitting(false);
    }
  }

  async function handleDeleteNpc(npc: Npc) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Remover NPC \"${npc.name}\"?`);
      if (!ok) return;
    }
    try {
      const res = await fetch(`/api/npcs/${npc.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Erro ao remover NPC");
      }
      setNpcs((prev) => prev.filter((item) => item.id !== npc.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover NPC";
      if (typeof window !== "undefined") window.alert(message);
    }
  }

  async function handleAddNpcToCombat(npc: Npc) {
    if (!campaignId) return;
    try {
      const payload = {
        name: npc.name,
        kind: npc.type === "enemy" ? "MONSTER" : "NPC",
        hpMax: npc.hpMax,
        defenseFinal: npc.defenseFinal,
        damageFormula: npc.damageFormula ?? "1d6",
      };
      const res = await fetch(`/api/campaigns/${campaignId}/combat/combatants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao adicionar NPC ao combate");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao adicionar NPC";
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
        description={error ?? "Campanha nÃ£o encontrada"}
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
            <Link href={`/app/play/${campaignId}`}>
              <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
                <Swords className="mr-2 h-4 w-4" />
                Iniciar Sessão
              </Button>
            </Link>
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
                    Nome, raca, classe e nivel (1 a 20) com validacao direta.
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Raca
                        </label>
                        <Input
                          value={form.ancestry ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, ancestry: e.target.value }))
                          }
                          placeholder="Humano, elfo, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Classe
                        </label>
                        <Input
                          value={form.className ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, className: e.target.value }))
                          }
                          placeholder="Guerreiro, mago, etc."
                        />
                      </div>
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
              description="Cadastre fichas para este grupo e acompanhe tudo em um sÃ³ lugar."
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
                  className="block h-full"
                >
                  <AgentCard
                    character={{
                      id: character.id,
                      name: character.name,
                      class: character.className || character.role || "Agente",
                      level: character.level,
                      avatarUrl: character.avatarUrl || undefined,
                      hp: { current: 10, max: 20 }, // Mock values since they aren't in the type yet
                      pm: { current: 5, max: 10 },
                      attributes: {} // Pass empty attributes to satisfy stricter types if needed
                    }}
                    onSelect={() => { }} // Link handles navigation
                    className="w-full h-48"
                  />
                  {/* Edit/Delete implementation would need to be moved outside the card or overlayed differently */}
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="npcs" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">NPCs</h3>
              <p className="text-sm text-muted-foreground">
                Prepare NPCs e adicione ao combate com um clique.
              </p>
            </div>
            <Dialog
              open={npcDialogOpen}
              onOpenChange={(open) => {
                setNpcDialogOpen(open);
                if (!open) {
                  setEditingNpc(null);
                  setNpcFormError(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="shadow-[0_0_24px_rgba(226,69,69,0.35)]"
                  onClick={openCreateNpc}
                >
                  <Plus className="h-4 w-4" />
                  Novo NPC
                </Button>
              </DialogTrigger>
              <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                  <DialogTitle>{editingNpc ? "Editar NPC" : "Novo NPC"}</DialogTitle>
                  <DialogDescription>
                    Nome, tipo, PV, defesa e ataque base com edicao rapida.
                  </DialogDescription>
                </DialogHeader>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSaveNpc}>
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Nome
                      </label>
                      <Input
                        value={npcForm.name}
                        onChange={(e) =>
                          setNpcForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Capitao da guarda"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Tipo
                      </label>
                      <select
                        className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                        value={npcForm.type}
                        onChange={(e) =>
                          setNpcForm((prev) => ({
                            ...prev,
                            type: e.target.value as "npc" | "enemy",
                          }))
                        }
                      >
                        <option value="npc">NPC</option>
                        <option value="enemy">Inimigo</option>
                      </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          PV
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={npcForm.hpMax}
                          onChange={(e) =>
                            setNpcForm((prev) => ({
                              ...prev,
                              hpMax: Number(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Defesa
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={npcForm.defenseFinal}
                          onChange={(e) =>
                            setNpcForm((prev) => ({
                              ...prev,
                              defenseFinal: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Ataque base
                      </label>
                      <Input
                        value={npcForm.damageFormula}
                        onChange={(e) =>
                          setNpcForm((prev) => ({
                            ...prev,
                            damageFormula: e.target.value,
                          }))
                        }
                        placeholder="1d6+2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Descricao
                      </label>
                      <Textarea
                        value={npcForm.description ?? ""}
                        onChange={(e) =>
                          setNpcForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Detalhes rapidos do NPC"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Tags
                      </label>
                      <Input
                        value={npcForm.tags ?? ""}
                        onChange={(e) =>
                          setNpcForm((prev) => ({ ...prev, tags: e.target.value }))
                        }
                        placeholder="guarda, cidade, aliado"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Imagem (opcional)
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={npcUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleNpcUpload(file);
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                      {npcForm.imageUrl ? (
                        <div className="space-y-2">
                          <img
                            src={npcForm.imageUrl}
                            alt={npcForm.name || "NPC"}
                            className="h-32 w-full rounded-lg border border-white/10 object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setNpcForm((prev) => ({ ...prev, imageUrl: "" }))
                            }
                          >
                            Remover imagem
                          </Button>
                        </div>
                      ) : null}
                      {npcUploading ? (
                        <p className="text-xs text-muted-foreground">Enviando imagem...</p>
                      ) : null}
                    </div>
                    {npcFormError ? (
                      <p className="text-sm text-destructive">{npcFormError}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 border-t border-white/10 px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        type="button"
                        className="text-muted-foreground"
                        onClick={() => setNpcDialogOpen(false)}
                        disabled={npcSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={npcSubmitting || npcUploading}
                        className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
                      >
                        {npcSubmitting
                          ? "Salvando..."
                          : editingNpc
                            ? "Salvar"
                            : "Criar NPC"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {sortedNpcs.length === 0 ? (
            <EmptyState
              title="Nenhum NPC ainda"
              description="Crie NPCs para preparar encontros e adversarios."
              action={
                <Button onClick={openCreateNpc}>
                  <Plus className="h-4 w-4" />
                  Novo NPC
                </Button>
              }
              icon={<NotebookPen className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedNpcs.map((npc) => (
                <NpcCard
                  key={npc.id}
                  npc={{
                    id: npc.id,
                    name: npc.name,
                    type: npc.type,
                    hpMax: npc.hpMax || 10,
                    defenseFinal: npc.defenseFinal || 10,
                    damageFormula: npc.damageFormula,
                    imageUrl: npc.imageUrl || undefined,
                    description: npc.description || undefined
                  }}
                  onSelect={() => openEditNpc(npc)}
                  onAddToCombat={() => void handleAddNpcToCombat(npc)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compendium">
          <EmptyState
            title="CompÃªndio em construÃ§Ã£o"
            description="Buscas instantÃ¢neas e referÃªncias rÃ¡pidas chegam em breve."
            icon={<Sparkles className="h-6 w-6" />}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Sessoes</h3>
              <p className="text-sm text-muted-foreground">
                Organize os encontros e abra o Modo Sessao quando precisar.
              </p>
            </div>
            <Dialog
              open={sessionDialogOpen}
              onOpenChange={(open) => {
                setSessionDialogOpen(open);
                if (!open) {
                  setEditingSession(null);
                  setSessionFormError(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="shadow-[0_0_24px_rgba(226,69,69,0.35)]"
                  onClick={openCreateSession}
                >
                  <Plus className="h-4 w-4" />
                  Nova sessao
                </Button>
              </DialogTrigger>
              <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                  <DialogTitle>
                    {editingSession ? "Editar sessao" : "Nova sessao"}
                  </DialogTitle>
                  <DialogDescription>
                    Defina titulo, descricao, data e capa opcional.
                  </DialogDescription>
                </DialogHeader>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSaveSession}>
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Titulo
                      </label>
                      <Input
                        value={sessionForm.title}
                        onChange={(e) =>
                          setSessionForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Sessao 12 - Fortaleza"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Resumo
                      </label>
                      <Textarea
                        value={sessionForm.description ?? ""}
                        onChange={(e) =>
                          setSessionForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                        placeholder="Resumo rapido do encontro"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Data / hora
                      </label>
                      <Input
                        type="datetime-local"
                        value={sessionForm.scheduledAt}
                        onChange={(e) =>
                          setSessionForm((prev) => ({ ...prev, scheduledAt: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Status
                      </label>
                      <select
                        className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                        value={sessionForm.status}
                        onChange={(e) =>
                          setSessionForm((prev) => ({
                            ...prev,
                            status: e.target.value as "planned" | "active" | "finished",
                          }))
                        }
                      >
                        <option value="planned">Planejada</option>
                        <option value="active">Ativa</option>
                        <option value="finished">Encerrada</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Capa (opcional)
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={sessionUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleCoverUpload(file);
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                      {sessionForm.coverUrl ? (
                        <div className="space-y-2">
                          <img
                            src={sessionForm.coverUrl}
                            alt={sessionForm.title || "Capa da sessao"}
                            className="h-32 w-full rounded-lg border border-white/10 object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSessionForm((prev) => ({ ...prev, coverUrl: "" }))
                            }
                          >
                            Remover imagem
                          </Button>
                        </div>
                      ) : null}
                      {sessionUploading ? (
                        <p className="text-xs text-muted-foreground">Enviando imagem...</p>
                      ) : null}
                    </div>
                    {sessionFormError ? (
                      <p className="text-sm text-destructive">{sessionFormError}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 border-t border-white/10 px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        type="button"
                        className="text-muted-foreground"
                        onClick={() => setSessionDialogOpen(false)}
                        disabled={sessionSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={sessionSubmitting || sessionUploading}
                        className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
                      >
                        {sessionSubmitting
                          ? "Salvando..."
                          : editingSession
                            ? "Salvar"
                            : "Criar sessao"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {sortedSessions.length === 0 ? (
            <EmptyState
              title="Nenhuma sessao ainda"
              description="Crie sessoes para organizar o log e abrir o modo ao vivo."
              action={
                <Button onClick={openCreateSession}>
                  <Plus className="h-4 w-4" />
                  Nova sessao
                </Button>
              }
              icon={<Swords className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedSessions.map((session) => {
                const displayDate = new Date(
                  session.scheduledAt ?? session.updatedAt
                ).toLocaleString("pt-BR");
                const statusLabel =
                  session.status === "active"
                    ? "Ativa"
                    : session.status === "finished"
                      ? "Encerrada"
                      : "Planejada";
                return (
                  <Card
                    key={session.id}
                    className="chrome-panel rounded-2xl border-white/10 bg-white/5"
                  >
                    {session.coverUrl ? (
                      <img
                        src={session.coverUrl}
                        alt={session.title}
                        className="h-36 w-full rounded-t-2xl border-b border-white/10 object-cover"
                      />
                    ) : null}
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-muted-foreground">
                            {statusLabel}
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground">
                            {displayDate}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        {session.description || "Sem descricao registrada."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openSessionMode(session)}>
                        Abrir no Modo Sessao
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditSession(session)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => void handleDeleteSession(session)}
                      >
                        Apagar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="combat">
          <CombatPanel
            campaignId={campaignId ?? ""}
            characters={characters}
          />
        </TabsContent>
      </Tabs>
    </div >
  );
}
