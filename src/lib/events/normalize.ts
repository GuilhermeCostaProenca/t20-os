import { EventPayload, EventType, EventVisibility } from "./types";

type InputLike = any;

function normalizeType(raw?: string): EventType {
  if (!raw) return "NOTE";
  const t = raw.toUpperCase();
  switch (t) {
    case "ATTACK":
    case "DAMAGE":
    case "SPELL":
    case "SKILL":
    case "CONDITION_APPLIED":
    case "CONDITION_REMOVED":
    case "NOTE":
    case "NPC_MENTION":
    case "ITEM_MENTION":
    case "OVERRIDE":
    case "TURN":
    case "INITIATIVE":
    case "SESSION_START":
    case "SESSION_END":
    case "ROLL":
      return t as EventType;
    case "NPC":
      return "NPC_MENTION";
    case "ITEM":
      return "ITEM_MENTION";
    case "SESSION":
      return "SESSION_START";
    default:
      return "NOTE";
  }
}

function normalizeVisibility(raw?: string | null): EventVisibility | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v === "master") return "MASTER";
  if (v === "players") return "PLAYERS";
  return undefined;
}

export function normalizeEvent(input: InputLike): EventPayload {
  const payload = input?.payloadJson ?? input?.payload ?? {};
  const type = normalizeType(input?.type);
  const visibility = normalizeVisibility(input?.visibility ?? payload.visibility);
  const ts = input?.ts ?? input?.timestamp ?? input?.createdAt ?? new Date().toISOString();

  const toHitRaw = payload.toHit ?? payload.roll;
  const toHit = toHitRaw
    ? {
        d20: toHitRaw?.d20 ?? toHitRaw?.base ?? 0,
        mod: toHitRaw?.mod ?? 0,
        total: toHitRaw?.total ?? 0,
        isNat20: toHitRaw?.isNat20,
        isNat1: toHitRaw?.isNat1,
        isCritThreat: toHitRaw?.isCritThreat,
        breakdown: toHitRaw?.breakdown,
      }
    : undefined;

  const damage = payload.damage
    ? {
        total: payload.damage.total ?? 0,
        detail: payload.damage.detail,
        isCrit: payload.damage.isCrit,
      }
    : undefined;

  const meta = {
    campaignId: payload.meta?.campaignId ?? input?.campaignId,
    sessionId: payload.meta?.sessionId ?? input?.sessionId,
    combatId: payload.meta?.combatId ?? input?.combatId,
  };

  return {
    type,
    ts,
    actorId: input?.actorId ?? payload.actorId,
    actorName: input?.actorName ?? payload.actorName ?? input?.name,
    targetId: input?.targetId ?? payload.targetId,
    targetName: payload.targetName,
    visibility,
    breakdown: {
      toHit: toHit?.d20 ? toHit : undefined,
      damage,
      formula: payload.damageFormula ?? payload.formula,
      cost: { mp: payload.costMp ?? payload.cost?.mp, hp: payload.costHp ?? payload.cost?.hp },
    },
    note: payload.note ?? input?.note,
    message: input?.message ?? payload.message,
    meta,
  };
}
