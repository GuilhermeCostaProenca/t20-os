"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getRuleset } from "@/rulesets";

type Character = {
  id: string;
  name: string;
  role?: string | null;
  level?: number | null;
};

type Props = {
  character: Character;
  initialSheet: any;
  rulesetId?: string;
};

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

export function CharacterSheetView({ character, initialSheet, rulesetId }: Props) {
  const [sheet, setSheet] = useState<any>(initialSheet);
  const ruleset = getRuleset(sheet?.sheetRulesetId ?? rulesetId);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setSheet(initialSheet);
  }, [initialSheet]);

  function setField(field: string, value: any) {
    setSheet((prev: any) => ({ ...prev, [field]: value }));
  }

  function updateArray(field: "skills" | "attacks" | "spells", updater: (items: any[]) => any[]) {
    setSheet((prev: any) => ({
      ...prev,
      [field]: updater(Array.isArray(prev?.[field]) ? prev[field] : []),
    }));
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/characters/${character.id}/sheet`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sheet, sheetRulesetId: ruleset.id }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Falha ao salvar ficha");
      setSheet(payload.data);
      setStatus("Ficha salva");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar ficha";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  }

  const abilityMods = useMemo(() => {
    const scores = sheet || {};
    const result: Record<string, number> = {};
    ruleset.abilities.forEach((ab) => {
      result[ab.key] = ruleset.getAbilityMod(scores[ab.key] ?? 10);
    });
    return result;
  }, [sheet, ruleset]);

  const sortedAbilities = [...ruleset.abilities].sort((a, b) => a.order - b.order);
  const resources = [...ruleset.resources].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Ficha</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{character.name}</h1>
            <Badge className="border-primary/40 bg-primary/10 text-primary">Personagem</Badge>
          </div>
          <p className="text-muted-foreground">Visual em secoes, pronto para mesa. Todos os campos sao editaveis.</p>
        </div>
        <Button onClick={save} disabled={saving} className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar ficha"}
        </Button>
      </div>

      {status ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">{status}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 chrome-panel border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Resumo rapido do heroi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input value={character.name} readOnly className="bg-white/5" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nivel</label>
                <Input type="number" value={sheet.level ?? 1} onChange={(e) => setField("level", Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Classe / Raca</label>
                <Input
                  placeholder="Guerreiro Humano"
                  value={sheet.className ?? ""}
                  onChange={(e) => setField("className", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Divindade</label>
                <Input placeholder="Kallyadranoch?" value={sheet.deity ?? ""} onChange={(e) => setField("deity", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Ancestralidade</label>
              <Input placeholder="Humano, Qareen..." value={sheet.ancestry ?? ""} onChange={(e) => setField("ancestry", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Notas</label>
              <Textarea
                rows={3}
                value={sheet.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Vinculos, personalidade, anotacoes rapidas."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 chrome-panel border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle>Atributos</CardTitle>
            <CardDescription>Valores e modificadores automaticos.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {sortedAbilities.map((ab) => (
              <div key={ab.key} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">{ab.label}</p>
                  <Badge variant="outline">mod {abilityMods[ab.key]}</Badge>
                </div>
                <Input
                  className="mt-3 text-center text-xl font-semibold"
                  type="number"
                  value={sheet[ab.key] ?? 10}
                  onChange={(e) => setField(ab.key, Number(e.target.value))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="chrome-panel border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle>Recursos</CardTitle>
            <CardDescription>PV/PM conforme o ruleset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.map((res) => {
              const currentKey = `${res.key}Current`;
              const maxKey = `${res.key}Max`;
              return (
                <div key={res.key} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">{res.label} Atual</label>
                    <Input
                      type="number"
                      value={sheet[currentKey] ?? 0}
                      onChange={(e) => setField(currentKey, Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{res.label} Max</label>
                    <Input
                      type="number"
                      value={sheet[maxKey] ?? 0}
                      onChange={(e) => setField(maxKey, Number(e.target.value))}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="chrome-panel border-white/10 bg-card/70 xl:col-span-2">
          <CardHeader>
            <CardTitle>Defesas e Resistencias</CardTitle>
            <CardDescription>Valores prontos para a rolagem.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm text-muted-foreground">Defesa</label>
              <Input type="number" value={sheet.defenseFinal ?? 0} onChange={(e) => setField("defenseFinal", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Reflexos</label>
              <Input type="number" value={sheet.defenseRef ?? 0} onChange={(e) => setField("defenseRef", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Fortitude</label>
              <Input type="number" value={sheet.defenseFort ?? 0} onChange={(e) => setField("defenseFort", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Vontade</label>
              <Input type="number" value={sheet.defenseWill ?? 0} onChange={(e) => setField("defenseWill", Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Pericias</CardTitle>
            <CardDescription>Lista editavel com modificador automatico.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
            updateArray("skills", (items) => [
                ...items,
                {
                  id: uid(),
                  name: "Nova pericia",
                  ability: ruleset.abilities[0]?.key ?? "int",
                  bonus: 0,
                  trained: false,
                  type: "check",
                  cost: 0,
                  formula: "",
                  cd: 0,
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(sheet.skills as any[])?.length ? null : <p className="text-sm text-muted-foreground">Nenhuma pericia cadastrada.</p>}
          {(sheet.skills as any[])?.map((skill: any, idx: number) => {
            const ability = skill.ability ?? ruleset.abilities[0]?.key ?? "int";
            const total =
              (abilityMods[ability] ?? 0) +
              (skill.bonus ?? 0) +
              (skill.misc ?? 0) +
              (skill.ranks ?? 0) +
              (skill.trained ? 2 : 0);
            return (
              <div key={skill.id || idx} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-7">
                <Input
                  className="md:col-span-2"
                  value={skill.name ?? ""}
                  onChange={(e) =>
                    updateArray("skills", (items) =>
                      items.map((it) => (it.id === skill.id ? { ...it, name: e.target.value } : it))
                    )
                  }
                />
                <select
                  className="rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                  value={ability}
                  onChange={(e) =>
                    updateArray("skills", (items) =>
                      items.map((it) => (it.id === skill.id ? { ...it, ability: e.target.value } : it))
                    )
                  }
                >
                  {sortedAbilities.map((ab) => (
                    <option key={ab.key} value={ab.key}>
                      {ab.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(skill.trained)}
                    onChange={(e) =>
                      updateArray("skills", (items) =>
                        items.map((it) => (it.id === skill.id ? { ...it, trained: e.target.checked } : it))
                      )
                    }
                  />
                  Treinado
                </label>
                <Input
                  type="number"
                  value={skill.ranks ?? 0}
                  onChange={(e) =>
                    updateArray("skills", (items) =>
                      items.map((it) => (it.id === skill.id ? { ...it, ranks: Number(e.target.value) } : it))
                    )
                  }
                  placeholder="Grad."
                />
                <Input
                  type="number"
                  value={skill.bonus ?? 0}
                  onChange={(e) =>
                    updateArray("skills", (items) =>
                      items.map((it) => (it.id === skill.id ? { ...it, bonus: Number(e.target.value) } : it))
                    )
                  }
                  placeholder="Bonus"
                />
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 text-sm font-semibold">
                  <span>Total</span>
                  <span>{total >= 0 ? `+${total}` : total}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Ataques</CardTitle>
            <CardDescription>Bonus, dano e critico preparados.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              updateArray("attacks", (items) => [
                ...items,
                {
                  id: uid(),
                  name: "Novo ataque",
                  ability: ruleset.abilities[0]?.key ?? "for",
                  bonus: 0,
                  damage: "1d6",
                  critRange: 20,
                  critMultiplier: 2,
                  type: "",
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(sheet.attacks as any[])?.length ? null : <p className="text-sm text-muted-foreground">Nenhum ataque cadastrado.</p>}
          {(sheet.attacks as any[])?.map((atk: any, idx: number) => (
            <div key={atk.id || idx} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-6">
              <Input
                className="md:col-span-2"
                value={atk.name ?? ""}
                onChange={(e) =>
                  updateArray("attacks", (items) =>
                    items.map((it) => (it.id === atk.id ? { ...it, name: e.target.value } : it))
                  )
                }
                placeholder="Espada longa"
              />
              <select
                className="rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                value={atk.ability ?? ruleset.abilities[0]?.key ?? "for"}
                onChange={(e) =>
                  updateArray("attacks", (items) =>
                    items.map((it) => (it.id === atk.id ? { ...it, ability: e.target.value } : it))
                  )
                }
              >
                {sortedAbilities.map((ab) => (
                  <option key={ab.key} value={ab.key}>
                    {ab.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                value={atk.bonus ?? 0}
                onChange={(e) =>
                  updateArray("attacks", (items) =>
                    items.map((it) => (it.id === atk.id ? { ...it, bonus: Number(e.target.value) } : it))
                  )
                }
                placeholder="Bonus"
              />
              <Input
                value={atk.damage ?? ""}
                onChange={(e) =>
                  updateArray("attacks", (items) =>
                    items.map((it) => (it.id === atk.id ? { ...it, damage: e.target.value } : it))
                  )
                }
                placeholder="1d8+2"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={atk.critRange ?? 20}
                  onChange={(e) =>
                    updateArray("attacks", (items) =>
                      items.map((it) => (it.id === atk.id ? { ...it, critRange: Number(e.target.value) } : it))
                    )
                  }
                  placeholder="20"
                />
                <Input
                  type="number"
                  value={atk.critMultiplier ?? 2}
                  onChange={(e) =>
                    updateArray("attacks", (items) =>
                      items.map((it) => (it.id === atk.id ? { ...it, critMultiplier: Number(e.target.value) } : it))
                    )
                  }
                  placeholder="x2"
                />
              </div>
              <Input
                value={atk.type ?? ""}
                onChange={(e) =>
                  updateArray("attacks", (items) =>
                    items.map((it) => (it.id === atk.id ? { ...it, type: e.target.value } : it))
                  )
                }
                placeholder="Tipo (corte/fogo...)"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="chrome-panel border-white/10 bg-card/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Magias</CardTitle>
            <CardDescription>Circulo, custo e efeito resumidos.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
            updateArray("spells", (items) => [
                ...items,
                { id: uid(), name: "Nova magia", circle: "", cost: 0, description: "", type: "attack", formula: "", cd: 0 },
              ])
            }
          >
            <Wand2 className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(sheet.spells as any[])?.length ? null : <p className="text-sm text-muted-foreground">Nenhuma magia cadastrada.</p>}
          {(sheet.spells as any[])?.map((spell: any, idx: number) => (
            <div key={spell.id || idx} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-6">
                <Input
                  className="md:col-span-2"
                  value={spell.name ?? ""}
                  onChange={(e) =>
                    updateArray("spells", (items) =>
                      items.map((it) => (it.id === spell.id ? { ...it, name: e.target.value } : it))
                    )
                  }
                  placeholder="Nome"
                />
                <Input
                  value={spell.circle ?? ""}
                  onChange={(e) =>
                    updateArray("spells", (items) =>
                      items.map((it) => (it.id === spell.id ? { ...it, circle: e.target.value } : it))
                    )
                  }
                  placeholder="Circulo"
                />
                <select
                  className="rounded-md border border-white/10 bg-black/20 px-3 text-sm"
                  value={spell.type ?? "attack"}
                  onChange={(e) =>
                    updateArray("spells", (items) =>
                      items.map((it) => (it.id === spell.id ? { ...it, type: e.target.value } : it))
                    )
                  }
                >
                  <option value="attack">Ataque</option>
                  <option value="save">Salvacao</option>
                  <option value="utility">Util</option>
                </select>
                <Input
                  type="number"
                  value={spell.cost ?? 0}
                  onChange={(e) =>
                    updateArray("spells", (items) =>
                      items.map((it) => (it.id === spell.id ? { ...it, cost: Number(e.target.value) } : it))
                    )
                  }
                  placeholder="Custo PM"
                />
                <Input
                  value={spell.formula ?? ""}
                  onChange={(e) =>
                    updateArray("spells", (items) =>
                      items.map((it) => (it.id === spell.id ? { ...it, formula: e.target.value } : it))
                    )
                  }
                  placeholder="Formula"
                />
                <Input
                  type="number"
                  value={spell.cd ?? 0}
                  onChange={(e) =>
                    updateArray("spells", (items) =>
                      items.map((it) => (it.id === spell.id ? { ...it, cd: Number(e.target.value) } : it))
                    )
                  }
                  placeholder="CD"
                />
              </div>
              <Textarea
                rows={2}
                value={spell.description ?? ""}
                onChange={(e) =>
                  updateArray("spells", (items) =>
                    items.map((it) => (it.id === spell.id ? { ...it, description: e.target.value } : it))
                  )
                }
                placeholder="Efeito resumido"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator className="border-white/10" />

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={save} disabled={saving}>
          Salvar
        </Button>
        <Button onClick={save} disabled={saving} className="shadow-[0_0_24px_rgba(226,69,69,0.35)]">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar ficha"}
        </Button>
      </div>
    </div>
  );
}
