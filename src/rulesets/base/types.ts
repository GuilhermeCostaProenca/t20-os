export type AbilityDef = {
  key: string;
  label: string;
  order: number;
};

export type ResourceDef = {
  key: string;
  label: string;
  order: number;
};

export type AttackResult = {
  d20: number;
  mod: number;
  total: number;
  isNat20: boolean;
  isNat1: boolean;
  isCritThreat?: boolean;
  breakdown?: string;
  attackName?: string;
};

export type DamageResult = {
  total: number;
  detail?: string;
  isCrit: boolean;
  attackName?: string;
};

export type CheckResult = {
  d20: number;
  mod: number;
  total: number;
  breakdown?: string;
};

export type ConditionModifiers = {
  attackMod?: number;
  skillMod?: number;
  spellMod?: number;
  damageMod?: number;
  costMpMod?: number;
  dcMod?: number;
  notes?: string[];
};

export type ConditionContext = {
  actorConditions?: any[];
  targetConditions?: any[];
  actionType?: "ATTACK" | "SPELL" | "SKILL";
  attack?: any;
  skill?: any;
  spell?: any;
};

export type SpellResult = {
  hitOrSaveResult?: CheckResult;
  damage?: DamageResult | null;
  cost?: { mp?: number };
  effectsApplied?: Array<{ conditionKey?: string; note?: string }>;
  breakdown?: string;
};

export interface Ruleset {
  id: string;
  name: string;
  abilities: AbilityDef[];
  resources: ResourceDef[];
  computeAttack: (args: { sheet: any; attack?: any; context?: ConditionContext }) => AttackResult;
  computeDamage: (args: { sheet: any; attack?: any; isCrit: boolean; context?: ConditionContext }) => DamageResult;
  computeSkillCheck: (args: { sheet: any; skill?: any; context?: ConditionContext }) => CheckResult;
  computeSpell: (args: { sheet: any; spell?: any; context?: ConditionContext }) => SpellResult;
  applyConditionsModifiers: (context: ConditionContext) => ConditionModifiers;
  getAbilityMod: (score: number) => number;
  validateSheet?: (sheet: any) => any;
}
