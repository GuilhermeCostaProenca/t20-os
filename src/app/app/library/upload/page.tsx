"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function UploadDocPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ruleset-docs", {
        method: "POST",
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Falha no upload");
      setStatus("Documento enviado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Biblioteca</p>
        <h1 className="text-3xl font-bold">Enviar documento</h1>
        <p className="text-muted-foreground">Apenas mestre (dev/local). PDFs vao para /public/uploads.</p>
      </div>

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader>
          <CardTitle>Novo PDF</CardTitle>
          <CardDescription>Defina titulo, ruleset e envie o arquivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget as HTMLFormElement);
              await handleSubmit(formData);
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Titulo</label>
                <Input name="title" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Ruleset</label>
                <Input name="rulesetId" defaultValue="tormenta20" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Tipo</label>
                <Input name="type" defaultValue="pdf" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Paginas (opcional)</label>
                <Input name="pages" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Arquivo</label>
                <Input name="file" type="file" accept="application/pdf" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Texto para busca (opcional)</label>
              <Textarea name="textIndex" rows={4} placeholder="Cole aqui o texto indexado ou resumo." />
            </div>
            <Button type="submit" disabled={loading} className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
              {loading ? "Enviando..." : "Enviar"}
            </Button>
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
