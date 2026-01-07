import { rollD20, rollFormula } from "@/lib/t20/dice";
import { abilityMod } from "@/lib/t20/modifiers";

import { AttackResult, DamageResult, Ruleset } from "../base/types";

const abilities = [
  { key: "for", label: "Forca", order: 1 },
  { key: "des", label: "Destreza", order: 2 },
  { key: "con", label: "Constituicao", order: 3 },
  { key: "int", label: "Inteligencia", order: 4 },
  { key: "sab", label: "Sabedoria", order: 5 },
  { key: "car", label: "Carisma", order: 6 },
];

const resources = [
  { key: "pv", label: "Pontos de Vida", order: 1 },
  { key: "pm", label: "Pontos de Mana", order: 2 },
];

function numberOr(value: any, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function textOr(value: any, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function ensureId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAttack(attack: any): any {
  const ability = typeof attack?.ability === "string" ? attack.ability : "for";
  return {
    id: textOr(attack?.id, ensureId("atk")),
    name: textOr(attack?.name, "Ataque"),
    ability,
    bonus: numberOr(attack?.bonus, 0),
    damage: textOr(attack?.damage, "1d6"),
    critRange: numberOr(attack?.critRange, 20),
    critMultiplier: numberOr(attack?.critMultiplier, 2),
    type: typeof attack?.type === "string" ? attack.type : "",
  };
}

function normalizeSkill(skill: any): any {
  const ability = typeof skill?.ability === "string" ? skill.ability : "int";
  return {
    id: textOr(skill?.id, ensureId("skill")),
    name: textOr(skill?.name, "Pericia"),
    ability,
    trained: Boolean(skill?.trained),
    ranks: numberOr(skill?.ranks, 0),
    bonus: numberOr(skill?.bonus, 0),
    misc: numberOr(skill?.misc, 0),
  };
}

function normalizeSpell(spell: any): any {
  return {
    id: textOr(spell?.id, ensureId("spell")),
    name: textOr(spell?.name, "Magia"),
    circle: textOr(spell?.circle, ""),
    cost: typeof spell?.cost === "number" || typeof spell?.cost === "string" ? spell.cost : "",
    description: textOr(spell?.description, ""),
    damage: textOr(spell?.damage, spell?.damageFormula ?? ""),
  };
}

function computeAttack({ sheet, attack }: { sheet: any; attack?: any }): AttackResult {
  const baseAbility = typeof sheet?.for === "number" ? sheet.for : 10;
  const abilityScore =
    typeof attack?.ability === "string" && typeof sheet?.[attack.ability] === "number"
      ? sheet[attack.ability]
      : typeof attack?.abilityScore === "number"
      ? attack.abilityScore
      : baseAbility;
  const attackBonus =
    typeof attack?.bonus === "number"
      ? attack.bonus
      : typeof sheet?.attackBonus === "number"
      ? sheet.attackBonus
      : 0;
  const mod = abilityMod(abilityScore) + attackBonus;
  const roll = rollD20(mod);
  const critRange =
    typeof attack?.critRange === "number"
      ? attack.critRange
      : typeof sheet?.critRange === "number"
      ? sheet.critRange
      : 20;
  const isCritThreat = roll.d20 >= critRange;

  return {
    ...roll,
    isCritThreat,
    breakdown: `d20=${roll.d20} + ${mod} = ${roll.total}`,
    attackName: attack?.name,
  };
}

function computeDamage({
  sheet,
  attack,
  isCrit,
}: {
  sheet: any;
  attack?: any;
  isCrit: boolean;
}): DamageResult {
  const formulaCandidate =
    typeof attack?.damage === "string" && attack.damage.trim().length > 0
      ? attack.damage
      : typeof sheet?.damageFormula === "string"
      ? sheet.damageFormula
      : undefined;
  const formula = formulaCandidate && formulaCandidate.trim().length > 0 ? formulaCandidate : "1d6";
  const critMultiplier =
    typeof attack?.critMultiplier === "number"
      ? attack.critMultiplier
      : typeof sheet?.critMultiplier === "number"
      ? sheet.critMultiplier
      : 2;

  const roll = rollFormula(formula);
  const total = isCrit ? roll.total * critMultiplier : roll.total;

  return { ...roll, total, isCrit, attackName: attack?.name };
}

function validateSheet(sheet: any) {
  const safe = { ...sheet };
  safe.sheetRulesetId = textOr(safe.sheetRulesetId, "tormenta20");
  safe.level = numberOr(safe.level, 1);
  safe.className = textOr(safe.className, safe.className ?? "");
  safe.ancestry = textOr(safe.ancestry, safe.ancestry ?? "");
  safe.deity = textOr(safe.deity, safe.deity ?? "");

  safe.for = numberOr(safe.for, 10);
  safe.des = numberOr(safe.des, 10);
  safe.con = numberOr(safe.con, 10);
  safe.int = numberOr(safe.int, 10);
  safe.sab = numberOr(safe.sab, 10);
  safe.car = numberOr(safe.car, 10);

  safe.pvCurrent = numberOr(safe.pvCurrent, 0);
  safe.pvMax = numberOr(safe.pvMax, 0);
  safe.pmCurrent = numberOr(safe.pmCurrent, 0);
  safe.pmMax = numberOr(safe.pmMax, 0);

  safe.attackBonus = numberOr(safe.attackBonus, 0);
  safe.damageFormula = textOr(safe.damageFormula, "1d6");
  safe.critRange = numberOr(safe.critRange, 20);
  safe.critMultiplier = numberOr(safe.critMultiplier, 2);
  safe.defenseFinal = numberOr(safe.defenseFinal, 10);
  safe.defenseRef = numberOr(safe.defenseRef, 0);
  safe.defenseFort = numberOr(safe.defenseFort, 0);
  safe.defenseWill = numberOr(safe.defenseWill, 0);

  safe.skills = Array.isArray(safe.skills) ? safe.skills.map((sk: any) => normalizeSkill(sk)) : [];
  safe.attacks = Array.isArray(safe.attacks) ? safe.attacks.map((atk: any) => normalizeAttack(atk)) : [];
  safe.spells = Array.isArray(safe.spells) ? safe.spells.map((sp: any) => normalizeSpell(sp)) : [];

  return safe;
}

export const tormenta20Ruleset: Ruleset = {
  id: "tormenta20",
  name: "Tormenta 20",
  abilities,
  resources,
  computeAttack,
  computeDamage,
  getAbilityMod: abilityMod,
  validateSheet,
};

export default tormenta20Ruleset;
