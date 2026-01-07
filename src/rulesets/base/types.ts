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

export interface Ruleset {
  id: string;
  name: string;
  abilities: AbilityDef[];
  resources: ResourceDef[];
  computeAttack: (args: { sheet: any; attack?: any }) => AttackResult;
  computeDamage: (args: { sheet: any; attack?: any; isCrit: boolean }) => DamageResult;
  getAbilityMod: (score: number) => number;
  validateSheet?: (sheet: any) => any;
}
