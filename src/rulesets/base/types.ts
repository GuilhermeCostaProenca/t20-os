
// Generic RPG Types (Universal)

export type AttributeKey = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';

export interface AttributeModifiers {
  for?: number;
  des?: number;
  con?: number;
  int?: number;
  sab?: number;
  car?: number;
}

export interface Ability {
  name: string;
  description: string;
  type?: 'passive' | 'active' | 'reaction';
  cost?: { pm?: number; action?: string };
}

export interface Race {
  id: string;
  name: string;
  attributes: AttributeModifiers;
  attributeSelectable?: number;
  abilities: Ability[];
  size: 'small' | 'medium' | 'large';
  displacement: number;
}

export interface CharacterClass {
  id: string;
  name: string;
  hp: { base: number; perLevel: number };
  pm: { base: number; perLevel: number };
  proficiencies: string[];
  description: string;
}

export interface RulesetData {
  id: string;
  name: string;
  races: Race[];
  classes: CharacterClass[];
}

// --- Engine Result Types ---

export interface ConditionModifiers {
  attackMod?: number;
  skillMod?: number;
  spellMod?: number;
  damageMod?: number;
  costMpMod?: number;
  dcMod?: number;
  notes?: string[];
}

export interface ConditionContext {
  actorConditions?: any[];
  targetConditions?: any[];
  actionType?: 'ATTACK' | 'SKILL' | 'SPELL';
  attack?: any;
  skill?: any;
  spell?: any;
}

export interface RollResult {
  d20?: number;
  total: number;
  detail?: string;
  breakdown?: string;
  isCrit?: boolean;
}

export interface AttackResult extends RollResult {
  isCritThreat: boolean;
  attackName?: string;
}

export interface DamageResult extends RollResult {
  damageType?: string;
  attackName?: string;
}

export interface CheckResult extends RollResult {
  mod: number;
}

export interface SpellResult {
  hitOrSaveResult?: CheckResult;
  damage?: DamageResult | null;
  cost: { mp: number };
  effectsApplied: any[];
  breakdown?: string;
}

export interface Ruleset {
  id: string;
  name: string;
  abilities: any[];
  resources: any[];
  computeAttack: (params: any) => AttackResult;
  computeDamage: (params: any) => DamageResult;
  computeSkillCheck: (params: any) => CheckResult;
  computeSpell: (params: any) => SpellResult;
  applyConditionsModifiers: (ctx: ConditionContext) => ConditionModifiers;
  getAbilityMod: (score: number) => number;
  validateSheet: (sheet: any) => any;
}
