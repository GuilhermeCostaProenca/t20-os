"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "./session-context";

function defaultSessionId() {
  const now = new Date();
  return `sessao-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function SessionSummaryButton() {
  const { state } = useSession();
  const [sessionId, setSessionId] = useState(defaultSessionId);
  const [campaignId, setCampaignId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("t20-session-id");
    setSessionId(stored || defaultSessionId());
    const handleOpen = () => {
      const next = localStorage.getItem("t20-session-id");
      if (next) setSessionId(next);
    };
    window.addEventListener("t20-open-session", handleOpen as EventListener);
    return () => window.removeEventListener("t20-open-session", handleOpen as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionId.trim()) return;
    localStorage.setItem("t20-session-id", sessionId.trim());
  }, [sessionId]);

  const eventsPayload = useMemo(
    () =>
      state.events.map((ev) => ({
        type: ev.type,
        actorName: ev.actorName,
        targetName: ev.targetName,
        payloadJson: ev.breakdown || undefined,
        ts: ev.timestamp,
        message: ev.message,
      })),
    [state.events]
  );

  async function handleGenerate() {
    if (!sessionId.trim()) {
      setStatus("Defina um ID da sessao.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId.trim())}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId.trim() || undefined,
          events: eventsPayload,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Falha ao gerar resumo");
      setStatus("Resumo gerado e salvo.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Sessao ID</p>
          <Input value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="w-48" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Campaign ID (opcional)</p>
          <Input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-56" />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !sessionId.trim()}
          className="shadow-[0_0_18px_rgba(226,69,69,0.3)]"
        >
          {loading ? "Gerando..." : "Gerar resumo"}
        </Button>
        {status ? <span className="text-xs text-muted-foreground">{status}</span> : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Envia o log local da sessao e busca eventos de combate da campanha (se informado).
      </p>
    </div>
  );
}
