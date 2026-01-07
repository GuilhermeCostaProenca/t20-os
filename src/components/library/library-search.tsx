"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchResult = {
  id: string;
  title: string;
  rulesetId: string;
  filePath: string;
  snippet?: string | null;
  page?: number;
};

export function LibrarySearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ruleset-docs/search?term=${encodeURIComponent(term)}`, {
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Falha na busca");
      setResults(payload.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro na busca";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="chrome-panel border-white/10 bg-card/70">
      <CardHeader>
        <CardTitle>Busca textual</CardTitle>
        <CardDescription>Busca simples no titulo e texto indexado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="flex gap-2" onSubmit={handleSearch}>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ex.: Valkaria" />
          <Button type="submit" variant="outline" disabled={loading || term.trim().length === 0}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {results.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {results.map((r) => (
              <Link key={r.id} href={`/app/library/${r.id}`}>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 hover:border-primary/30">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold line-clamp-1">{r.title}</p>
                    <Badge variant="outline">{r.rulesetId}</Badge>
                  </div>
                  {r.snippet ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">...{r.snippet}...</p>
                  ) : null}
                  {r.page ? (
                    <p className="text-[11px] text-muted-foreground">Pagina sugerida: {r.page}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
