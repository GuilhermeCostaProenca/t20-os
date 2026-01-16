import { prisma } from "@/lib/prisma";
import { CreateEventParams } from "./types";
import { WorldEventScope, WorldEventType, WorldEventVisibility } from "@prisma/client";
import { processEvent } from "./processors";

export async function dispatchEvent(params: CreateEventParams) {
    const {
        type,
        worldId,
        campaignId,
        entityId,
        actorId,
        payload,
        visibility = WorldEventVisibility.PLAYERS,
        scope = WorldEventScope.MICRO, // Default to MICRO, upgradable later
    } = params;

    // Determine scope based on type if not provided (optional heuristic)
    // For now we trust the caller or default.

    // 2. Strict Validation for Creation Events
    if (["WORLD_CREATED", "CAMPAIGN_CREATED", "CHARACTER_CREATED"].includes(type)) {
        if (!payload) {
            throw new Error(`Event ${type} requires a payload.`);
        }
        if (!worldId) {
            throw new Error(`Event ${type} requires a worldId.`);
        }
    }

    // Pre-calculate expensive things outside transaction
    let newRoomCode: string | undefined;
    if (type === "CAMPAIGN_CREATED" && campaignId) {
        const { createUniqueRoomCode } = await import("./processors/campaign");
        // Note: We are running this outside the MAIN transaction to avoid hold time.
        // Uniqueness race condition is rare enough for this MVP.
        // To be strictly safe, we would need to pass prisma instance, not tx, or retry.
        newRoomCode = await createUniqueRoomCode(prisma);
    }

    // wrapping in transaction to ensure Ledger + Projection atomicity
    return prisma.$transaction(async (tx) => {
        // 0. Bootstrap World for FK constraint
        if (type === "WORLD_CREATED") {
            // We create a shell to satisfy the WorldEvent foreign key.
            const existing = await tx.world.findUnique({ where: { id: worldId }, select: { id: true } });
            if (!existing) {
                await tx.world.create({
                    data: {
                        id: worldId,
                        title: "Pending Initialization...",
                    },
                });
            }
        }

        if (type === "CAMPAIGN_CREATED" && campaignId && newRoomCode) {
            // Bootstrap Campaign if it doesn't exist
            const existing = await tx.campaign.findUnique({ where: { id: campaignId }, select: { id: true } });
            if (!existing) {
                await tx.campaign.create({
                    data: {
                        id: campaignId,
                        worldId,
                        name: "Pending...",
                        roomCode: newRoomCode,
                    }
                });
            }
        }

        // 1. Persist to Ledger
        const event = await tx.worldEvent.create({
            data: {
                worldId,
                campaignId,
                type,
                scope,
                visibility,
                actorId,
                targetId: entityId, // Map entityId to targetId
                payload: payload as any, // Prisma Json type
            },
        });

        // 2. Apply Projection (Processors)
        await processEvent(tx, event);

        return event;
    }, {
        maxWait: 5000, // Wait max 5s for connection
        timeout: 10000 // Transaction runs for max 10s
    });
}
