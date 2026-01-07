"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Campaign = {
  id: string;
  name: string;
};

type Character = {
  id: string;
  campaignId: string;
  name: string;
  role?: string | null;
  level: number;
  updatedAt: string;
  campaign?: Campaign | null;
};

export default function PersonagensPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, characterRes] = await Promise.all([
        fetch("/api/campaigns", { cache: "no-store" }),
        fetch("/api/characters", { cache: "no-store" }),
      ]);
      const campaignPayload = await campaignRes.json();
      if (!campaignRes.ok) {
        throw new Error(campaignPayload.error ?? "Falha ao carregar campanhas");
      }
      const characterPayload = await characterRes.json();
      if (!characterRes.ok) {
        throw new Error(characterPayload.error ?? "Falha ao carregar personagens");
      }
      setCampaigns(campaignPayload.data ?? []);
      setCharacters(characterPayload.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar personagens";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const normalizedTerm = term.trim().toLowerCase();
    return characters.filter((character) => {
      if (campaignFilter && character.campaignId !== campaignFilter) return false;
      if (!normalizedTerm) return true;
      const haystack = [
        character.name,
        character.role ?? "",
        character.campaign?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedTerm);
    });
  }, [characters, term, campaignFilter]);

  const hasFilters = term.trim().length > 0 || campaignFilter.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Personagens</p>
          <h1 className="text-3xl font-bold">Fichas e personagens</h1>
          <p className="text-muted-foreground">
            Explore fichas por campanha e encontre personagens rapidamente.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-primary/30 text-primary"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Separator className="border-white/10" />

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader>
          <CardTitle>Busca e filtro</CardTitle>
          <CardDescription>Filtre por campanha e nome do personagem.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Busca</label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Nome, funcao ou campanha"
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
          title={hasFilters ? "Nenhum resultado" : "Nenhum personagem ainda"}
          description={
            hasFilters
              ? "Ajuste os filtros ou limpe a busca para ver outros personagens."
              : "Crie personagens em uma campanha para preencher esta lista."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((character) => (
            <Link
              key={character.id}
              href={`/app/personagens/${character.id}`}
              className="block"
            >
              <Card className="chrome-panel group rounded-2xl border-white/10 bg-white/5 transition duration-150 hover:-translate-y-1 hover:border-primary/25">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="border-primary/25 bg-primary/10 text-primary">
                      Nivel {character.level}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <CardTitle className="text-lg">{character.name}</CardTitle>
                  <CardDescription>
                    {character.role || "Sem papel definido"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {character.campaign?.name ?? "Campanha nao informada"}
                  </span>
                  <span>
                    {new Date(character.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
