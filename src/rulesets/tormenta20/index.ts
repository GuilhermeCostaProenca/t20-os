import { rollD20, rollFormula } from "@/lib/t20/dice";
import { abilityMod } from "@/lib/t20/modifiers";

import { AttackResult, DamageResult, Ruleset } from "../base/types";

const abilities = [
  { key: "for", label: "Força", order: 1 },
  { key: "des", label: "Destreza", order: 2 },
  { key: "con", label: "Constituição", order: 3 },
  { key: "int", label: "Inteligência", order: 4 },
  { key: "sab", label: "Sabedoria", order: 5 },
  { key: "car", label: "Carisma", order: 6 },
];

const resources = [
  { key: "pv", label: "Pontos de Vida", order: 1 },
  { key: "pm", label: "Pontos de Mana", order: 2 },
];

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

export const tormenta20Ruleset: Ruleset = {
  id: "tormenta20",
  name: "Tormenta 20",
  abilities,
  resources,
  computeAttack,
  computeDamage,
  getAbilityMod: abilityMod,
};

export default tormenta20Ruleset;
