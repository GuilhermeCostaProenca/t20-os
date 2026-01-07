import { Ruleset } from "./base/types";
import { tormenta20Ruleset } from "./tormenta20";

const registry: Record<string, Ruleset> = {
  tormenta20: tormenta20Ruleset,
};

export function getRuleset(id?: string): Ruleset {
  if (id && registry[id]) return registry[id];
  return registry.tormenta20;
}

export const rulesets = registry;
