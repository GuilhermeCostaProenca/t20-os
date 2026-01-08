"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { NpcCreateSchema } from "@/lib/validators";

type Campaign = {
  id: string;
  name: string;
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
  updatedAt: string;
  campaign?: Campaign | null;
};

const initialNpcForm = {
  campaignId: "",
  name: "",
  type: "npc" as "npc" | "enemy",
  hpMax: 1,
  defenseFinal: 10,
  damageFormula: "1d6",
  description: "",
  tags: "",
  imageUrl: "",
};

export default function NpcsPage() {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null);
  const [npcForm, setNpcForm] = useState(initialNpcForm);
  const [npcFormError, setNpcFormError] = useState<string | null>(null);
  const [npcUploading, setNpcUploading] = useState(false);
  const [npcSubmitting, setNpcSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, npcRes] = await Promise.all([
        fetch("/api/campaigns", { cache: "no-store" }),
        fetch("/api/npcs", { cache: "no-store" }),
      ]);
      const campaignPayload = await campaignRes.json();
      if (!campaignRes.ok) {
        throw new Error(campaignPayload.error ?? "Falha ao carregar campanhas");
      }
      const npcPayload = await npcRes.json();
      if (!npcRes.ok) {
        throw new Error(npcPayload.error ?? "Falha ao carregar NPCs");
      }
      setCampaigns(campaignPayload.data ?? []);
      setNpcs(npcPayload.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar NPCs";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const normalizedTerm = term.trim().toLowerCase();
    return npcs.filter((npc) => {
      if (campaignFilter && npc.campaignId !== campaignFilter) return false;
      if (!normalizedTerm) return true;
      const haystack = [
        npc.name,
        npc.tags ?? "",
        npc.campaign?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedTerm);
    });
  }, [npcs, term, campaignFilter]);

  const hasFilters = term.trim().length > 0 || campaignFilter.length > 0;

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

  function openCreateNpc() {
    setEditingNpc(null);
    setNpcForm(initialNpcForm);
    setNpcFormError(null);
    setDialogOpen(true);
  }

  function openEditNpc(npc: Npc) {
    setEditingNpc(npc);
    setNpcForm({
      campaignId: npc.campaignId,
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
    setDialogOpen(true);
  }

  async function handleSaveNpc(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setNpcFormError(null);
    if (!npcForm.campaignId) {
      setNpcFormError("Campanha obrigatoria");
      return;
    }

    const parsed = NpcCreateSchema.safeParse({
      name: npcForm.name,
      type: npcForm.type,
      hpMax: npcForm.hpMax,
      defenseFinal: npcForm.defenseFinal,
      damageFormula: npcForm.damageFormula,
      description: npcForm.description,
      tags: npcForm.tags,
      imageUrl: npcForm.imageUrl,
    });
    if (!parsed.success) {
      setNpcFormError(parsed.error.issues[0]?.message ?? "Dados invalidos");
      return;
    }

    setNpcSubmitting(true);
    try {
      const endpoint = editingNpc
        ? `/api/npcs/${editingNpc.id}`
        : `/api/campaigns/${npcForm.campaignId}/npcs`;
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
      setDialogOpen(false);
      setEditingNpc(null);
      setNpcForm(initialNpcForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao salvar NPC";
      setNpcFormError(message);
    } finally {
      setNpcSubmitting(false);
    }
  }

  async function handleDeleteNpc(npc: Npc) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Remover NPC "${npc.name}"?`);
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
    try {
      const payload = {
        name: npc.name,
        kind: npc.type === "enemy" ? "MONSTER" : "NPC",
        hpMax: npc.hpMax,
        defenseFinal: npc.defenseFinal,
        damageFormula: npc.damageFormula ?? "1d6",
      };
      const res = await fetch(`/api/campaigns/${npc.campaignId}/combat/combatants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao adicionar NPC ao combate");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao adicionar NPC";
      if (typeof window !== "undefined") window.alert(message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">NPCs</p>
          <h1 className="text-3xl font-bold">NPCs e inimigos</h1>
          <p className="text-muted-foreground">
            Gerencie NPCs por campanha e adicione ao combate rapidamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary/30 text-primary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingNpc(null);
                setNpcFormError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="shadow-[0_0_24px_rgba(226,69,69,0.35)]" onClick={openCreateNpc}>
                <Plus className="h-4 w-4" />
                Novo NPC
              </Button>
            </DialogTrigger>
            <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-xl flex-col overflow-hidden border-white/10 bg-card/80 p-0 text-left backdrop-blur">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                <DialogTitle>{editingNpc ? "Editar NPC" : "Novo NPC"}</DialogTitle>
                <DialogDescription>
                  Defina campanha, tipo, PV, defesa e ataque base.
                </DialogDescription>
              </DialogHeader>
              <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSaveNpc}>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Campanha</label>
                    <select
                      className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                      value={npcForm.campaignId}
                      onChange={(e) =>
                        setNpcForm((prev) => ({ ...prev, campaignId: e.target.value }))
                      }
                    >
                      <option value="">Selecione uma campanha</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                      value={npcForm.name}
                      onChange={(e) => setNpcForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Capitao da guarda"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tipo</label>
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
                      <label className="text-sm font-medium text-foreground">PV</label>
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
                      <label className="text-sm font-medium text-foreground">Defesa</label>
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
                    <label className="text-sm font-medium text-foreground">Ataque base</label>
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
                    <label className="text-sm font-medium text-foreground">Descricao</label>
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
                    <label className="text-sm font-medium text-foreground">Tags</label>
                    <Input
                      value={npcForm.tags ?? ""}
                      onChange={(e) => setNpcForm((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="guarda, cidade, aliado"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Imagem (opcional)</label>
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
                          onClick={() => setNpcForm((prev) => ({ ...prev, imageUrl: "" }))}
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
                      onClick={() => setDialogOpen(false)}
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
      </div>

      <Separator className="border-white/10" />

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader>
          <CardTitle>Busca e filtro</CardTitle>
          <CardDescription>Filtre por campanha e nome do NPC.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Busca</label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Nome, tag ou campanha"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Campanha</label>
            <select
              className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-between gap-2">
            <Badge variant="outline" className="text-muted-foreground">
              {filtered.length} resultado(s)
            </Badge>
            {hasFilters ? (
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setTerm("");
                  setCampaignFilter("");
                }}
              >
                Limpar
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="chrome-panel h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Falha ao carregar"
          description={error}
          action={
            <Button onClick={loadData} className="shadow-[0_0_18px_rgba(226,69,69,0.3)]">
              Tentar novamente
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nenhum resultado" : "Nenhum NPC ainda"}
          description={
            hasFilters
              ? "Ajuste os filtros ou limpe a busca para ver outros NPCs."
              : "Crie NPCs em uma campanha para preencher esta lista."
          }
          action={
            hasFilters ? null : (
              <Button onClick={openCreateNpc}>
                <Plus className="h-4 w-4" />
                Novo NPC
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((npc) => {
            const tags = npc.tags
              ? npc.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              : [];
            return (
              <Card
                key={npc.id}
                className="chrome-panel rounded-2xl border-white/10 bg-white/5"
              >
                {npc.imageUrl ? (
                  <img
                    src={npc.imageUrl}
                    alt={npc.name}
                    className="h-36 w-full rounded-t-2xl border-b border-white/10 object-cover"
                  />
                ) : null}
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{npc.name}</CardTitle>
                    <Badge variant="outline" className="text-muted-foreground">
                      {npc.type === "enemy" ? "Inimigo" : "NPC"}
                    </Badge>
                  </div>
                  <CardDescription>
                    PV {npc.hpMax} / Defesa {npc.defenseFinal} / Ataque {npc.damageFormula}
                  </CardDescription>
                  <CardDescription>
                    {npc.campaign?.name ?? "Campanha nao informada"}
                  </CardDescription>
                  {npc.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {npc.description}
                    </p>
                  ) : null}
                  {tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-muted-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void handleAddNpcToCombat(npc)}>
                    Adicionar ao combate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditNpc(npc)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void handleDeleteNpc(npc)}
                  >
                    Apagar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}