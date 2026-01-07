import { rollD20, rollFormula } from "@/lib/t20/dice";
import { abilityMod } from "@/lib/t20/modifiers";

import {
  AttackResult,
  CheckResult,
  ConditionContext,
  ConditionModifiers,
  DamageResult,
  Ruleset,
  SpellResult,
} from "../base/types";

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
    type: textOr(skill?.type, "check"),
    cost: numberOr(skill?.cost, 0),
    formula: textOr(skill?.formula, ""),
    cd: numberOr(skill?.cd ?? skill?.dc, 0),
  };
}

function normalizeSpell(spell: any): any {
  return {
    id: textOr(spell?.id, ensureId("spell")),
    name: textOr(spell?.name, "Magia"),
    circle: textOr(spell?.circle, ""),
    cost: numberOr(typeof spell?.cost === "string" ? Number(spell?.cost) : spell?.cost, 0),
    description: textOr(spell?.description, ""),
    damage: textOr(spell?.damage, spell?.damageFormula ?? ""),
    formula: textOr(spell?.formula, spell?.damage ?? spell?.damageFormula ?? ""),
    cd: numberOr(spell?.cd ?? spell?.dc, 0),
    type: textOr(spell?.type, "attack"),
    ability: typeof spell?.ability === "string" ? spell.ability : "int",
    effectsApplied: Array.isArray(spell?.effectsApplied) ? spell.effectsApplied : [],
  };
}

function extractModifiers(entry: any) {
  const effects = entry?.condition?.effectsJson ?? entry?.effectsJson ?? {};
  const mods = effects?.modifiers ?? effects ?? {};
  return {
    attack: numberOr(mods?.attack, 0),
    skill: numberOr(mods?.skill, 0),
    spell: numberOr(mods?.spell, 0),
    damage: numberOr(mods?.damage, 0),
    costMp: numberOr(mods?.costMp, 0),
    dc: numberOr(mods?.dc, 0),
    defense: numberOr(mods?.defense, 0),
    damageTaken: numberOr(mods?.damageTaken, 0),
  };
}

function sumModifiers(conditions: any[]): ReturnType<typeof extractModifiers> {
  return (conditions ?? []).reduce(
    (acc, entry) => {
      const mods = extractModifiers(entry);
      acc.attack += mods.attack;
      acc.skill += mods.skill;
      acc.spell += mods.spell;
      acc.damage += mods.damage;
      acc.costMp += mods.costMp;
      acc.dc += mods.dc;
      acc.defense += mods.defense;
      acc.damageTaken += mods.damageTaken;
      return acc;
    },
    {
      attack: 0,
      skill: 0,
      spell: 0,
      damage: 0,
      costMp: 0,
      dc: 0,
      defense: 0,
      damageTaken: 0,
    }
  );
}

function applyConditionsModifiers(context: ConditionContext): ConditionModifiers {
  const actorMods = sumModifiers(context?.actorConditions ?? []);
  const targetMods = sumModifiers(context?.targetConditions ?? []);
  const attackMod = actorMods.attack + (targetMods.defense ? -targetMods.defense : 0);
  const damageMod = actorMods.damage + targetMods.damageTaken;
  const notes: string[] = [];
  if (attackMod) notes.push(`Ataque ${attackMod >= 0 ? "+" : ""}${attackMod}`);
  if (actorMods.skill) notes.push(`Pericia ${actorMods.skill >= 0 ? "+" : ""}${actorMods.skill}`);
  if (actorMods.spell) notes.push(`Magia ${actorMods.spell >= 0 ? "+" : ""}${actorMods.spell}`);
  if (damageMod) notes.push(`Dano ${damageMod >= 0 ? "+" : ""}${damageMod}`);
  if (actorMods.costMp) notes.push(`PM ${actorMods.costMp >= 0 ? "+" : ""}${actorMods.costMp}`);
  return {
    attackMod,
    skillMod: actorMods.skill,
    spellMod: actorMods.spell,
    damageMod,
    costMpMod: actorMods.costMp,
    dcMod: actorMods.dc,
    notes: notes.length ? notes : undefined,
  };
}

function computeAttack({
  sheet,
  attack,
  context,
}: {
  sheet: any;
  attack?: any;
  context?: ConditionContext;
}): AttackResult {
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
  const conditionMods = applyConditionsModifiers({
    ...(context ?? {}),
    actionType: "ATTACK",
    attack,
  });
  const mod = abilityMod(abilityScore) + attackBonus + (conditionMods.attackMod ?? 0);
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
    breakdown: `d20=${roll.d20} + ${mod} = ${roll.total}${
      conditionMods.notes?.length ? ` (${conditionMods.notes.join(", ")})` : ""
    }`,
    attackName: attack?.name,
  };
}

function computeDamage({
  sheet,
  attack,
  isCrit,
  context,
}: {
  sheet: any;
  attack?: any;
  isCrit: boolean;
  context?: ConditionContext;
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

  const conditionMods = applyConditionsModifiers({
    ...(context ?? {}),
    actionType: "ATTACK",
    attack,
  });
  const roll = rollFormula(formula);
  const adjusted = roll.total + (conditionMods.damageMod ?? 0);
  const total = isCrit ? adjusted * critMultiplier : adjusted;
  const detail = `${roll.detail}${conditionMods.damageMod ? (conditionMods.damageMod > 0 ? "+" : "") + conditionMods.damageMod : ""}`;

  return { ...roll, total, detail, isCrit, attackName: attack?.name };
}

function computeSkillCheck({
  sheet,
  skill,
  context,
}: {
  sheet: any;
  skill?: any;
  context?: ConditionContext;
}): CheckResult {
  const abilityKey = skill?.ability ?? "int";
  const abilityScore = typeof sheet?.[abilityKey] === "number" ? sheet[abilityKey] : 10;
  const baseMod =
    abilityMod(abilityScore) +
    numberOr(skill?.bonus, 0) +
    numberOr(skill?.misc, 0) +
    numberOr(skill?.ranks, 0) +
    (skill?.trained ? 2 : 0);
  const conditionMods = applyConditionsModifiers({
    ...(context ?? {}),
    actionType: "SKILL",
    skill,
  });
  const mod = baseMod + (conditionMods.skillMod ?? 0);
  const roll = rollD20(mod);
  return {
    d20: roll.d20,
    mod,
    total: roll.total,
    breakdown: `d20=${roll.d20} + ${mod} = ${roll.total}${
      conditionMods.notes?.length ? ` (${conditionMods.notes.join(", ")})` : ""
    }`,
  };
}

function computeSpell({
  sheet,
  spell,
  context,
}: {
  sheet: any;
  spell?: any;
  context?: ConditionContext;
}): SpellResult {
  const normalized = normalizeSpell(spell);
  const conditionMods = applyConditionsModifiers({
    ...(context ?? {}),
    actionType: "SPELL",
    spell: normalized,
  });
  const costMp = numberOr(normalized.cost, 0) + (conditionMods.costMpMod ?? 0);
  const type = textOr(normalized.type, "attack").toLowerCase();
  const abilityKey = normalized.ability ?? "int";
  const abilityScore = typeof sheet?.[abilityKey] === "number" ? sheet[abilityKey] : 10;
  const baseMod = abilityMod(abilityScore) + (conditionMods.spellMod ?? 0);

  let hitOrSaveResult: CheckResult | undefined;
  if (type === "save") {
    const cd = numberOr(normalized.cd, 0) + (conditionMods.dcMod ?? 0);
    hitOrSaveResult = {
      d20: 0,
      mod: conditionMods.dcMod ?? 0,
      total: cd,
      breakdown: `CD ${cd}`,
    };
  } else {
    const roll = rollD20(baseMod);
    hitOrSaveResult = {
      d20: roll.d20,
      mod: baseMod,
      total: roll.total,
      breakdown: `d20=${roll.d20} + ${baseMod} = ${roll.total}${
        conditionMods.notes?.length ? ` (${conditionMods.notes.join(", ")})` : ""
      }`,
    };
  }

  const formula = textOr(normalized.formula, "");
  const damage =
    formula && formula.length > 0
      ? (() => {
          const roll = rollFormula(formula);
          const adjusted = roll.total + (conditionMods.damageMod ?? 0);
          return {
            total: adjusted,
            detail: `${roll.detail}${conditionMods.damageMod ? (conditionMods.damageMod > 0 ? "+" : "") + conditionMods.damageMod : ""}`,
            isCrit: false,
            attackName: normalized.name,
          };
        })()
      : null;

  return {
    hitOrSaveResult,
    damage,
    cost: { mp: costMp },
    effectsApplied: Array.isArray(normalized.effectsApplied)
      ? normalized.effectsApplied.map((entry: any) =>
          typeof entry === "string" ? { conditionKey: entry } : entry
        )
      : [],
    breakdown: hitOrSaveResult?.breakdown,
  };
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
  computeSkillCheck,
  computeSpell,
  applyConditionsModifiers,
  getAbilityMod: abilityMod,
  validateSheet,
};

export default tormenta20Ruleset;
