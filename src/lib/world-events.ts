import { prisma } from "@/lib/prisma";
import { normalizeEvent } from "@/lib/events/normalize";
import { CombatEvent, WorldEventScope, WorldEventType, WorldEventVisibility } from "@prisma/client";

const worldEventTypes = new Set(Object.values(WorldEventType));

function resolveWorldEventType(type?: string | null) {
  if (!type) return WorldEventType.NOTE;
  const upper = type.toUpperCase();
  if (worldEventTypes.has(upper as WorldEventType)) {
    return upper as WorldEventType;
  }
  return WorldEventType.NOTE;
}

function resolveVisibility(visibility?: string | null) {
  if (!visibility) return undefined;
  const upper = visibility.toUpperCase();
  if (upper === "MASTER") return WorldEventVisibility.MASTER;
  if (upper === "PLAYERS") return WorldEventVisibility.PLAYERS;
  return undefined;
}

function toDate(value?: string | Date | null) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function resolveWorldId({
  worldId,
  campaignId,
  combatId,
}: {
  worldId?: string | null;
  campaignId?: string | null;
  combatId?: string | null;
}) {
  if (worldId) return worldId;

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { worldId: true },
    });
    return campaign?.worldId;
  }

  if (combatId) {
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      select: { campaign: { select: { worldId: true } } },
    });
    return combat?.campaign?.worldId;
  }

  return undefined;
}

export async function appendWorldEventFromCombatEvent(
  event: CombatEvent,
  context: {
    worldId?: string | null;
    campaignId?: string | null;
    combatId?: string | null;
    sessionId?: string | null;
  }
) {
  const normalized = normalizeEvent({
    ...event,
    campaignId: context.campaignId,
    combatId: context.combatId ?? event.combatId,
  });

  const worldId = await resolveWorldId({
    worldId: context.worldId,
    campaignId: context.campaignId,
    combatId: context.combatId ?? event.combatId,
  });

  if (!worldId) return null;

  const meta = normalized.meta && Object.values(normalized.meta).some(Boolean)
    ? normalized.meta
    : undefined;

  return prisma.worldEvent.create({
    data: {
      worldId,
      campaignId: context.campaignId,
      combatId: context.combatId ?? event.combatId,
      sessionId: context.sessionId ?? normalized.meta?.sessionId,
      type: resolveWorldEventType(normalized.type),
      scope: WorldEventScope.MICRO,
      ts: toDate(normalized.ts) ?? event.ts,
      actorId: normalized.actorId,
      targetId: normalized.targetId,
      visibility: resolveVisibility(normalized.visibility) ?? WorldEventVisibility.PLAYERS,
      breakdown: normalized.breakdown ?? undefined,
      meta,
      text: normalized.message ?? normalized.note ?? undefined,
    },
  });
}

export async function appendWorldEventFromSessionEvent(
  event: {
    type?: string | null;
    payloadJson?: any;
    ts?: string | Date | null;
    message?: string | null;
    visibility?: string | null;
  },
  context: {
    worldId?: string | null;
    campaignId?: string | null;
    sessionId?: string | null;
  }
) {
  const normalized = normalizeEvent({
    ...event,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
  });

  const worldId = await resolveWorldId({
    worldId: context.worldId,
    campaignId: context.campaignId,
  });

  if (!worldId) return null;

  const meta = normalized.meta && Object.values(normalized.meta).some(Boolean)
    ? normalized.meta
    : undefined;

  return prisma.worldEvent.create({
    data: {
      worldId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      type: resolveWorldEventType(normalized.type),
      scope: WorldEventScope.MICRO,
      ts: toDate(normalized.ts) ?? new Date(),
      actorId: normalized.actorId,
      targetId: normalized.targetId,
      visibility: resolveVisibility(normalized.visibility) ?? WorldEventVisibility.PLAYERS,
      breakdown: normalized.breakdown ?? undefined,
      meta,
      text: normalized.message ?? normalized.note ?? undefined,
    },
  });
}
