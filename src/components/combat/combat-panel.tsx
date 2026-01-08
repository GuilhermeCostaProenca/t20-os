"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plus, ScrollText } from "lucide-react";

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

type CharacterLite = { id: string; name: string };

type Combatant = {
  id: string;
  name: string;
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  mpCurrent: number;
  mpMax: number;
  defenseFinal?: number;
  attackBonus?: number;
  damageFormula?: string;
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
  events?: any[];
};

type Props = {
  campaignId: string;
  characters: CharacterLite[];
};

type ActionResult = {
  kind?: "ATTACK" | "SPELL" | "SKILL";
  attackName?: string;
  toHit?: {
    d20: number;
    mod: number;
    total: number;
    isNat20?: boolean;
    isNat1?: boolean;
    isCritThreat?: boolean;
    breakdown?: string;
  };
  damage?: { total: number; detail?: string; isCrit?: boolean };
  costMp?: number;
};

export function CombatPanel({ campaignId, characters }: Props) {
  const [loading, setLoading] = useState(false);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [attacker, setAttacker] = useState("");
  const [target, setTarget] = useState("");
  const [actionKind, setActionKind] = useState<"ATTACK" | "SPELL" | "SKILL">("ATTACK");
  const [selectedAttackId, setSelectedAttackId] = useState("");
  const [selectedSpellId, setSelectedSpellId] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [sheetData, setSheetData] = useState<Record<string, { attacks: any[]; spells: any[]; skills: any[] }>>({});
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [overrideInputs, setOverrideInputs] = useState<Record<string, string>>({});
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);
  const [npcForm, setNpcForm] = useState({
    name: "",
    hpMax: 10,
    defenseFinal: 10,
    damageFormula: "1d6",
  });
  const [npcError, setNpcError] = useState<string | null>(null);
  const [npcSubmitting, setNpcSubmitting] = useState(false);

  const orderedCombatants = useMemo(() => {
    if (!combat?.combatants) return [];
    return [...combat.combatants].sort((a, b) => b.initiative - a.initiative);
  }, [combat]);

  const currentCombatant =
    orderedCombatants[(combat?.turnIndex ?? 0) % (orderedCombatants.length || 1)];
  const attackerEntity = orderedCombatants.find((c) => c.id === attacker);
  const attackerIsCharacter = attackerEntity?.kind === "CHARACTER";

  useEffect(() => {
    if (!campaignId) return;
    refresh();
  }, [campaignId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (campaignId) refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [campaignId]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (campaignId) loadPending();
    }, 1000);
    loadPending();
    return () => clearInterval(interval);
  }, [campaignId]);

  useEffect(() => {
    if (!attacker) {
      setSelectedAttackId("");
      setSelectedSpellId("");
      setSelectedSkillId("");
      return;
    }
    const combatant = orderedCombatants.find((c) => c.id === attacker);
    if (!combatant || combatant.kind !== "CHARACTER" || !combatant.refId) {
      setSelectedAttackId("");
      setSelectedSpellId("");
      setSelectedSkillId("");
      return;
    }
    const cached = sheetData[attacker];
    if (cached) {
      const attackList = cached.attacks ?? [];
      const spellList = cached.spells ?? [];
      const skillList = cached.skills ?? [];

      if (attackList.length) {
        const stillValid = attackList.find((a: any) => a.id === selectedAttackId || a.name === selectedAttackId);
        if (!stillValid) {
          setSelectedAttackId(attackList[0].id || attackList[0].name || "");
        }
      } else {
        setSelectedAttackId("");
      }

      if (spellList.length) {
        const stillValid = spellList.find((s: any) => s.id === selectedSpellId || s.name === selectedSpellId);
        if (!stillValid) {
          setSelectedSpellId(spellList[0].id || spellList[0].name || "");
        }
      } else {
        setSelectedSpellId("");
      }

      if (skillList.length) {
        const stillValid = skillList.find((s: any) => s.id === selectedSkillId || s.name === selectedSkillId);
        if (!stillValid) {
          setSelectedSkillId(skillList[0].id || skillList[0].name || "");
        }
      } else {
        setSelectedSkillId("");
      }
      return;
    }
    void loadSheetData(combatant);
  }, [attacker, orderedCombatants, sheetData, selectedAttackId, selectedSpellId, selectedSkillId]);

  async function refresh() {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/combat`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(payload.error ?? "Falha ao carregar combate");
        return;
      }
      setCombat(payload.data);
      setStatus(null);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao carregar combate");
    }
  }

  async function loadPending() {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/play/action?campaignId=${campaignId}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setPendingActions(payload.data ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadSheetData(combatant: Combatant) {
    if (!combatant.refId) return;
    try {
      const res = await fetch(`/api/characters/${combatant.refId}/sheet`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) return;
      const attacks = Array.isArray(payload.data?.attacks) ? payload.data.attacks : [];
      const spells = Array.isArray(payload.data?.spells) ? payload.data.spells : [];
      const skills = Array.isArray(payload.data?.skills) ? payload.data.skills : [];
      setSheetData((prev) => ({ ...prev, [combatant.id]: { attacks, spells, skills } }));
      if (attacks.length) {
        setSelectedAttackId(attacks[0].id || attacks[0].name || "");
      }
      if (spells.length) {
        setSelectedSpellId(spells[0].id || spells[0].name || "");
      }
      if (skills.length) {
        setSelectedSkillId(skills[0].id || skills[0].name || "");
      }
    } catch (err) {
      console.error("loadSheetData", err);
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

  async function createNpc(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!campaignId) return;
    if (!npcForm.name.trim()) {
      setNpcError("Defina um nome para o inimigo.");
      return;
    }
    setNpcSubmitting(true);
    setNpcError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/combat/combatants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: npcForm.name.trim(),
          kind: "NPC",
          hpMax: npcForm.hpMax,
          defenseFinal: npcForm.defenseFinal,
          damageFormula: npcForm.damageFormula,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? "Falha ao criar inimigo");
      }
      setNpcDialogOpen(false);
      setNpcForm({ name: "", hpMax: 10, defenseFinal: 10, damageFormula: "1d6" });
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar inimigo";
      setNpcError(msg);
    } finally {
      setNpcSubmitting(false);
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
            kind: "CHARACTER" as const,
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
      setStatus("Erro ao alterar turno");
    } finally {
      setLoading(false);
    }
  }

  async function applyDelta(targetId: string, deltaHp: number, note?: string) {
    if (!combat) return;
    setLoading(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/combat/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, deltaHp, visibility: "MASTER", note }),
      });
      await refresh();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao aplicar ajuste");
    } finally {
      setLoading(false);
    }
  }

  async function executeAction() {
    if (!combat?.id || !attacker || !target) {
      setStatus("Selecione atacante e alvo.");
      return;
    }
    if (!attackerIsCharacter && actionKind !== "ATTACK") {
      setStatus("Apenas personagens podem usar magia ou pericia.");
      return;
    }
    setLoading(true);
    setStatus("Executando acao...");
    try {
      const useSheet = attackerIsCharacter;
      const body: Record<string, any> = {
        actorId: attacker,
        actorName: attackerEntity?.name ?? "Atacante",
        kind: actionKind,
        targetId: target,
        useSheet,
        visibility: "MASTER",
      };
      if (actionKind === "ATTACK" && useSheet) {
        body.attackId = selectedAttackId || undefined;
      }
      if (actionKind === "SPELL" && useSheet) {
        body.spellId = selectedSpellId || undefined;
      }
      if (actionKind === "SKILL" && useSheet) {
        body.skillId = selectedSkillId || undefined;
      }

      const res = await fetch(`/api/campaigns/${campaignId}/combat/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? "Falha ao executar acao");
      }
      setActionResult({
        attackName:
          payload.data?.event?.payloadJson?.attackName ||
          payload.data?.event?.payloadJson?.spellName ||
          payload.data?.event?.payloadJson?.skillName ||
          payload.data?.attack?.name ||
          attackerEntity?.name,
        toHit: payload.data?.toHit,
        damage: payload.data?.damage,
        kind: actionKind,
        costMp: payload.data?.event?.payloadJson?.costMp,
      });
      setStatus("Dano aplicado automaticamente.");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao rolar";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  }

  const events = combat?.events ?? [];

  return (
    <div className="space-y-4">
      {pendingActions.length > 0 ? (
        <Card className="chrome-panel border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Acoes pendentes</CardTitle>
              <CardDescription>Solicitacoes de jogadores aguardando aprovacao do mestre.</CardDescription>
            </div>
            <Badge variant="outline">{pendingActions.length} pendente(s)</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingActions.map((req) => {
              const actorName = orderedCombatants.find((c) => c.id === req.actorId)?.name ?? req.actorId;
              const targetName = orderedCombatants.find((c) => c.id === req.targetId)?.name ?? req.targetId;
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {actorName}
                      {" -> "}
                      {targetName}
                    </p>
                    <p className="text-xs text-muted-foreground">Tipo: {req.type} • Room: {req.roomCode ?? "?"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await fetch(`/api/play/action/${req.id}/apply`, { method: "POST" });
                        await loadPending();
                        await refresh();
                      }}
                    >
                      Aplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await fetch(`/api/play/action/${req.id}/apply`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "reject" }),
                        });
                        await loadPending();
                      }}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Combate</CardTitle>
            <CardDescription>
              Fluxo completo para o mestre. Ataques aplicam dano automaticamente; overrides sempre possiveis.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={npcDialogOpen} onOpenChange={setNpcDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={loading || !campaignId}>
                  <Plus className="h-4 w-4" />
                  Adicionar inimigo
                </Button>
              </DialogTrigger>
              <DialogContent className="chrome-panel flex max-h-[85vh] w-[95vw] max-w-lg flex-col overflow-hidden border-white/10 bg-card/90 p-0 text-left backdrop-blur">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                  <DialogTitle>Novo inimigo</DialogTitle>
                  <DialogDescription>Defina nome, PV, defesa e dano base.</DialogDescription>
                </DialogHeader>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={createNpc}>
                  <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <Input
                      value={npcForm.name}
                      onChange={(e) => setNpcForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Esqueleto"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">PV Max</label>
                      <Input
                        type="number"
                        min={1}
                        value={npcForm.hpMax}
                        onChange={(e) =>
                          setNpcForm((prev) => ({ ...prev, hpMax: Number(e.target.value) || 1 }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">Defesa</label>
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
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Dano base</label>
                    <Input
                      value={npcForm.damageFormula}
                      onChange={(e) =>
                        setNpcForm((prev) => ({ ...prev, damageFormula: e.target.value }))
                      }
                      placeholder="1d6+2"
                    />
                  </div>
                  {npcError ? <p className="text-sm text-destructive">{npcError}</p> : null}
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
                      <Button type="submit" disabled={npcSubmitting}>
                        {npcSubmitting ? "Criando..." : "Adicionar"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={startCombat} disabled={loading || !campaignId}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar combate"}
            </Button>
          </div>
        </CardHeader>
        {combat ? (
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-primary/25 bg-primary/10 text-primary">Round {combat.round ?? 1}</Badge>
              <Badge variant="outline" className="text-muted-foreground">
                Turno: {currentCombatant?.name ?? "Sem combatente"}
              </Badge>
              {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={rollInitiative} disabled={loading}>
                Rolar iniciativa
              </Button>
              <Button variant="outline" onClick={() => changeTurn("prev")} disabled={loading}>
                Turno anterior
              </Button>
              <Button variant="outline" onClick={() => changeTurn("next")} disabled={loading}>
                Proximo turno
              </Button>
            </div>
            <Separator className="border-white/10" />
            <div className="grid gap-3 md:grid-cols-2">
              {orderedCombatants.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Init {c.initiative} | PV {c.hpCurrent}/{c.hpMax} | PM {c.mpCurrent ?? 0}/{c.mpMax ?? 0} | Def{" "}
                      {c.defenseFinal ?? 0} | Dano {c.damageFormula ?? "1d6"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={overrideInputs[c.id] ?? ""}
                        onChange={(e) =>
                          setOverrideInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Delta PV"
                        className="h-8 w-20 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const delta = Number(overrideInputs[c.id]);
                          if (isNaN(delta) || delta === 0) return;
                          applyDelta(c.id, delta, "override manual");
                          setOverrideInputs((prev) => ({ ...prev, [c.id]: "" }));
                        }}
                      >
                        Override
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => applyDelta(c.id, -5, "ajuste rapido")}>
                      -5 PV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => applyDelta(c.id, 5, "ajuste rapido")}>
                      +5 PV
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Inicie o combate ou aguarde conexao com o servidor.
          </CardContent>
        )}
      </Card>

      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Acao rapida (ficha)</CardTitle>
          <CardDescription>Escolha atacante, alvo e a acao da ficha. Dano aplicado automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
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
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Tipo</label>
              <select
                value={actionKind}
                onChange={(e) => setActionKind(e.target.value as any)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
              >
                <option value="ATTACK">Ataque</option>
                <option value="SPELL">Magia</option>
                <option value="SKILL">Pericia</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                {actionKind === "SPELL" ? "Magia da ficha" : actionKind === "SKILL" ? "Pericia da ficha" : "Ataque da ficha"}
              </label>
              <select
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                value={
                  actionKind === "SPELL" ? selectedSpellId : actionKind === "SKILL" ? selectedSkillId : selectedAttackId
                }
                onChange={(e) => {
                  if (actionKind === "SPELL") setSelectedSpellId(e.target.value);
                  if (actionKind === "SKILL") setSelectedSkillId(e.target.value);
                  if (actionKind === "ATTACK") setSelectedAttackId(e.target.value);
                }}
                disabled={!attacker || (actionKind !== "ATTACK" && !attackerIsCharacter)}
              >
                {(() => {
                  if (actionKind === "ATTACK" && !attackerIsCharacter) {
                    return <option value="">Ataque base do inimigo</option>;
                  }
                  const data = sheetData[attacker];
                  if (actionKind === "SPELL") {
                    const list = data?.spells ?? [];
                    if (!list?.length) return <option value="">Nenhuma magia</option>;
                    return list.map((item: any) => (
                      <option key={item.id || item.name} value={item.id || item.name}>
                        {item.name ?? "Magia"}
                      </option>
                    ));
                  }
                  if (actionKind === "SKILL") {
                    const list = data?.skills ?? [];
                    if (!list?.length) return <option value="">Nenhuma pericia</option>;
                    return list.map((item: any) => (
                      <option key={item.id || item.name} value={item.id || item.name}>
                        {item.name ?? "Pericia"}
                      </option>
                    ));
                  }
                  const list = data?.attacks ?? [];
                  if (!list?.length) return <option value="">Padrao (bonus da ficha)</option>;
                  return list.map((item: any) => (
                    <option key={item.id || item.name} value={item.id || item.name}>
                      {item.name ?? "Ataque"}
                    </option>
                  ));
                })()}
              </select>
              {!attackerIsCharacter && attackerEntity && actionKind === "ATTACK" ? (
                <p className="text-xs text-muted-foreground">
                  Dano base: {attackerEntity.damageFormula ?? "1d6"}
                </p>
              ) : null}
              {!attackerIsCharacter && actionKind !== "ATTACK" ? (
                <p className="text-xs text-muted-foreground">Acoes magicas exigem ficha.</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Resumo</label>
              <Input
                disabled
                value={
                  actionKind === "SPELL"
                    ? "Consome PM automaticamente"
                    : actionKind === "SKILL"
                    ? "Registra rolagem"
                    : "Ataque com dano automatico"
                }
                className="h-10 bg-black/20 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={executeAction}
              disabled={
                loading ||
                !attacker ||
                !target
              }
            >
              Executar ataque
            </Button>
          </div>
          {actionResult ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm space-y-2">
              <div className="flex items-center gap-2">
                {actionResult.kind ? (
                  <Badge variant="outline" className="capitalize">
                    {actionResult.kind.toLowerCase()}
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  d20 {actionResult.toHit?.total} ({actionResult.toHit?.d20})
                </Badge>
                {actionResult.toHit?.isCritThreat ? (
                  <Badge className="bg-primary/20 text-primary">Ameaca</Badge>
                ) : null}
                {actionResult.toHit?.isNat20 ? (
                  <Badge className="bg-primary/20 text-primary">Critico</Badge>
                ) : actionResult.toHit?.isNat1 ? (
                  <Badge variant="destructive">Falha</Badge>
                ) : null}
                {actionResult.damage ? (
                  <Badge variant="outline">
                    Dano {actionResult.damage.total}
                    {actionResult.damage.isCrit ? " (crit)" : ""}
                  </Badge>
                ) : null}
                {actionResult.costMp ? (
                  <Badge variant="outline">PM -{actionResult.costMp}</Badge>
                ) : null}
              </div>
              {actionResult.attackName ? (
                <p className="text-muted-foreground">Ataque: {actionResult.attackName}</p>
              ) : null}
              {actionResult.toHit?.breakdown ? (
                <p className="text-muted-foreground text-xs">Ataque: {actionResult.toHit.breakdown}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {actionResult.damage ? "Efeito aplicado no alvo." : "Rolagem registrada no log."}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="chrome-panel border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Log de eventos</CardTitle>
            <CardDescription>Breakdown de rolagens e efeitos aplicados.</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <ScrollText className="h-3 w-3" />
            {events.length} eventos
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento ainda.</p>
          ) : (
            events.map((ev: any) => {
              const payload = ev.payloadJson ?? {};
              return (
                <div
                  key={ev.id}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-tight"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {ev.type.toLowerCase()}
                      </Badge>
                      <span className="font-semibold">{payload.actorName ?? ev.actorName}</span>
                      {payload.targetName || payload.targetId ? (
                        <span className="text-muted-foreground">
                          {" -> "}
                          {payload.targetName ?? payload.targetId}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ev.ts ?? ev.createdAt ?? Date.now()).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  {payload.toHit ? (
                    <p className="text-xs text-muted-foreground">
                      d20 {payload.toHit.total} ({payload.toHit.d20}) | mod {payload.toHit.mod}
                      {payload.toHit.isCritThreat ? " | ameaca" : ""}{" "}
                      {payload.toHit.isNat20 ? " | critico" : payload.toHit.isNat1 ? " | falha" : ""}
                    </p>
                  ) : null}
                  {payload.damage ? (
                    <p className="text-xs text-muted-foreground">
                      Dano {payload.damage.total} {payload.damage.detail ? `(${payload.damage.detail})` : ""}
                    </p>
                  ) : null}
                  {payload.costMp ? (
                    <p className="text-xs text-muted-foreground">Custo PM: {payload.costMp}</p>
                  ) : null}
                  {payload.hpAfter !== undefined ? (
                    <p className="text-xs text-muted-foreground">HP alvo: {payload.hpAfter}</p>
                  ) : null}
                  {payload.note ? <p className="text-xs text-muted-foreground">Nota: {payload.note}</p> : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
