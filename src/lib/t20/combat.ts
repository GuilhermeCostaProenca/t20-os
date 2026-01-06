import { abilityMod, clamp } from "./modifiers";
import { rollD20, rollFormula } from "./dice";

export function computeInitiative(desScore: number) {
  const mod = abilityMod(desScore || 10);
  const roll = rollD20(mod);
  return { ...roll, mod };
}

export function applyDelta(current: number, max: number, delta: number) {
  return clamp(current + delta, 0, max);
}

export const T20Dice = {
  rollD20,
  rollFormula,
  computeInitiative,
  applyDelta,
};

export type SheetLike = {
  for: number;
  attackBonus: number;
  damageFormula: string;
  critRange: number;
  critMultiplier: number;
};

export function computeAttackRoll(sheet: SheetLike) {
  const mod = abilityMod(sheet.for ?? 10) + (sheet.attackBonus ?? 0);
  const roll = rollD20(mod);
  const isCritThreat = roll.d20 >= (sheet.critRange ?? 20);
  return { ...roll, isCritThreat, breakdown: `d20=${roll.d20} + ${mod} = ${roll.total}` };
}

export function computeDamage(sheet: SheetLike, isCrit: boolean) {
  const dmg = rollFormula(sheet.damageFormula || "1d6");
  const total = isCrit ? dmg.total * (sheet.critMultiplier || 2) : dmg.total;
  return { ...dmg, total, isCrit };
}
