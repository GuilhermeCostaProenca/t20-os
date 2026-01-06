"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Swords } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { rollD20, rollFormula } from "@/lib/t20/dice";

type CharacterLite = {
  id: string;
  name: string;
};

type Combatant = {
  id: string;
  name: string;
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  kind?: string;
  refId?: string;
};

type CombatState = {
  id: string;
  campaignId: string;
  isActive: boolean;
  round: number;
  turnIndex: number;
  combatants: Combatant[];
};

type Props = {
  campaignId: string;
  characters: CharacterLite[];
};

type RollResult = {
  toHit?: {
    d20: number;
    mod: number;
    total: number;
    isNat20: boolean;
    isNat1: boolean;
    isCritThreat?: boolean;
    breakdown?: string;
  };
  damage?: { total: number; detail: string };
  message?: string;
};

export function CombatPanel({ campaignId, characters }: Props) {
  const [loading, setLoading] = useState(false);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [attacker, setAttacker] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [toHitMod, setToHitMod] = useState(0);
  const [damageFormula, setDamageFormula] = useState("1d8+2");
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [sheetRoll, setSheetRoll] = useState<RollResult | null>(null);
  const [overrideDamage, setOverrideDamage] = useState<number | "">("");

  const orderedCombatants = useMemo(() => {
    if (!combat?.combatants) return [];
    return [...combat.combatants].sort((a, b) => b.initiative - a.initiative);
  }, [combat]);

  const currentCombatant =
    orderedCombatants[(combat?.turnIndex ?? 0) % (orderedCombatants.length || 1)];

  useEffect(() => {
    if (!campaignId) return;
    refresh();
  }, [campaignId]);

  async function refresh() {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/combat`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error ?? "Falha ao carregar combate");
        return;
      }
      setCombat(payload.data);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao carregar combate");
    }
  }

  async function startCombat() {
    setLoading(true);
    setStatus(null);
    try {
      await fetch(`/api/campaigns/${campaignId}/combat`, { method: "POST" });
      await refresh();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao iniciar combate");
    } finally {
      setLoading(false);
    }
  }

  async function rollInitiative() {
    if (!combat) return;
    setLoading(true);
    setStatus("Rolando iniciativa...");
    try {
      await fetch(`/api/campaigns/${campaignId}/combat/initiative`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          combatants: characters.map((c) => ({
            name: c.name,
            refId: c.id,
            kind: "CHARACTER",
            des: 10,
            hpMax: 10,
            hpCurrent: 10,
            mpMax: 5,
            mpCurrent: 5,
          })),
        }),
      });
      await refresh();
      setStatus(null);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao rolar iniciativa");
    } finally {
      setLoading(false);
    }
  }

  async function changeTurn(direction: "next" | "prev") {
    if (!combat) return;
    setLoading(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/combat/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      await refresh();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao mudar turno");
    } finally {
      setLoading(false);
    }
  }

  async function applyDelta(targetId: string, deltaHp: number) {
    if (!combat) return;
    setLoading(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/combat/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, deltaHp }),
      });
      await refresh();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao aplicar PV");
    } finally {
      setLoading(false);
    }
  }

  async function handleRollAttack() {
    if (!attacker || !target) {
      setStatus("Selecione atacante e alvo.");
      return;
    }
    const toHit = rollD20(toHitMod);
    const damage = damageFormula ? rollFormula(damageFormula) : null;
    setRollResult({
      toHit,
      damage: damage ?? undefined,
      message: toHit.isNat20
        ? "Crítico!"
        : toHit.isNat1
        ? "Falha crítica"
        : "Resolvido",
    });
    setStatus(null);
  }

  async function handleApplyDamage() {
    if (!rollResult?.damage || !target) return;
    await applyDelta(target, -Math.abs(rollResult.damage.total));
  }

  async function handleAttackFromSheet() {
    if (!combat?.id || !attacker || !target) {
      setStatus("Selecione atacante e alvo.");
      return;
    }
    setLoading(true);
    setStatus("Rolando pela ficha...");
    try {
      const res = await fetch("/api/combat/attack-from-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          combatId: combat.id,
          attackerCombatantId: attacker,
          targetCombatantId: target,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? "Falha ao rolar ataque");
      }
      const toHit = payload.data?.toHit;
      const damage = payload.data?.damage;
      setSheetRoll({ toHit, damage, message: payload.data?.attacker });
      setOverrideDamage(damage?.total ?? "");
      setStatus(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao rolar";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplySheetDamage() {
    if (!target) return;
    const value = typeof overrideDamage === "number" ? overrideDamage : Number(overrideDamage);
    if (!value || isNaN(value)) return;
    await applyDelta(target, -Math.abs(value));
  }

  return (
    <div className="space-y-4">
      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Combate</CardTitle>
            <CardDescription>
              Controle rápido de turno e PV. Mestre pode sobrescrever a qualquer momento.
            </CardDescription>
          </div>
          <Button onClick={startCombat} disabled={loading || !campaignId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar combate"}
          </Button>
        </CardHeader>
        {combat ? (
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-primary/25 bg-primary/10 text-primary">
                Round {combat.round ?? 1}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                Turno: {currentCombatant?.name ?? "—"}
              </Badge>
              {status ? (
                <span className="text-sm text-muted-foreground">{status}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={rollInitiative} disabled={loading}>
                Rolar iniciativa
              </Button>
              <Button variant="outline" onClick={() => changeTurn("prev")} disabled={loading}>
                Turno anterior
              </Button>
              <Button onClick={() => changeTurn("next")} disabled={loading}>
                Próximo turno
              </Button>
            </div>

            <Separator className="border-white/10" />

            <div className="grid gap-2">
              {orderedCombatants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem combatentes ainda. Rolar iniciativa para carregar personagens.
                </p>
              ) : (
                orderedCombatants.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {c.initiative}
                      </Badge>
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground">
                        PV {c.hpCurrent}/{c.hpMax}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => applyDelta(c.id, -5)}>
                        -5 PV
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => applyDelta(c.id, 5)}>
                        +5 PV
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inicie o combate para ver round, turno e combatentes.
            </p>
          </CardContent>
        )}
      </Card>

      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Ação simples</CardTitle>
          <CardDescription>Rolagem de ataque com dano. Mestre confirma aplicação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Atacante</label>
              <select
                value={attacker}
                onChange={(e) => setAttacker(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              >
                <option value="">Selecione</option>
                {orderedCombatants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Alvo</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              >
                <option value="">Selecione</option>
                {orderedCombatants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Modificador de ataque</label>
              <Input
                type="number"
                value={toHitMod}
                onChange={(e) => setToHitMod(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-muted-foreground">Fórmula de dano</label>
              <Input
                value={damageFormula}
                onChange={(e) => setDamageFormula(e.target.value)}
                placeholder="Ex.: 1d8+4"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRollAttack} disabled={!attacker || !target}>
              Rolar ataque
            </Button>
            <Button
              variant="outline"
              onClick={handleApplyDamage}
              disabled={!rollResult?.damage || !target}
            >
              Aplicar dano
            </Button>
          </div>
          {rollResult ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  d20 {rollResult.toHit?.total} ({rollResult.toHit?.d20})
                </Badge>
                {rollResult.damage ? (
                  <Badge variant="outline">Dano {rollResult.damage.total}</Badge>
                ) : null}
                {rollResult.toHit?.isNat20 ? (
                  <Badge className="bg-primary/20 text-primary">Crítico</Badge>
                ) : rollResult.toHit?.isNat1 ? (
                  <Badge variant="destructive">Falha</Badge>
                ) : null}
              </div>
              {rollResult.damage ? (
                <p className="text-muted-foreground">Detalhe dano: {rollResult.damage.detail}</p>
              ) : null}
              {rollResult.message ? (
                <p className="text-muted-foreground">{rollResult.message}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Ataque (Ficha)</CardTitle>
          <CardDescription>Usa bônus/dano da ficha do personagem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Atacante</label>
              <select
                value={attacker}
                onChange={(e) => setAttacker(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              >
                <option value="">Selecione</option>
                {orderedCombatants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Alvo</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              >
                <option value="">Selecione</option>
                {orderedCombatants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAttackFromSheet}
              disabled={
                loading ||
                !attacker ||
                !target ||
                orderedCombatants.find((c) => c.id === attacker)?.kind !== "CHARACTER"
              }
            >
              Atacar (Ficha)
            </Button>
            <Button
              variant="outline"
              onClick={handleApplySheetDamage}
              disabled={!sheetRoll || !target || overrideDamage === ""}
            >
              Aplicar dano
            </Button>
          </div>
          {sheetRoll ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  d20 {sheetRoll.toHit?.total} ({sheetRoll.toHit?.d20})
                </Badge>
                {sheetRoll.toHit?.isCritThreat ? (
                  <Badge className="bg-primary/20 text-primary">Ameaça</Badge>
                ) : null}
                {sheetRoll.toHit?.isNat20 ? (
                  <Badge className="bg-primary/20 text-primary">Crítico</Badge>
                ) : sheetRoll.toHit?.isNat1 ? (
                  <Badge variant="destructive">Falha</Badge>
                ) : null}
                {sheetRoll.damage ? (
                  <Badge variant="outline">Dano {sheetRoll.damage.total}</Badge>
                ) : null}
              </div>
              {sheetRoll.toHit?.breakdown ? (
                <p className="text-muted-foreground">Ataque: {sheetRoll.toHit.breakdown}</p>
              ) : null}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Dano (edite se quiser)</label>
                <Input
                  value={overrideDamage}
                  onChange={(e) => setOverrideDamage(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Dano"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
