export type RollD20Result = {
  d20: number;
  mod: number;
  total: number;
  isNat20: boolean;
  isNat1: boolean;
};

export function rollDie(sides: number) {
  const value = Math.floor(Math.random() * sides) + 1;
  return { value, detail: `d${sides}:${value}` };
}

export function rollD20(mod = 0): RollD20Result {
  const roll = rollDie(20).value;
  const total = roll + mod;
  return {
    d20: roll,
    mod,
    total,
    isNat20: roll === 20,
    isNat1: roll === 1,
  };
}

export function rollFormula(formula: string) {
  const trimmed = formula.trim();
  const match = trimmed.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    return { total: 0, detail: "invalid" };
  }
  const count = Number(match[1]);
  const faces = Number(match[2]);
  const mod = match[3] ? Number(match[3]) : 0;
  let acc = 0;
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    const r = rollDie(faces).value;
    rolls.push(r);
    acc += r;
  }
  acc += mod;
  return { total: acc, detail: `${rolls.join("+")}${mod ? (mod > 0 ? "+" : "") + mod : ""}` };
}
