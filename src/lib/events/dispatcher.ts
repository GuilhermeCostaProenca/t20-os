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

    // wrapping in transaction to ensure Ledger + Projection atomicity
    return prisma.$transaction(async (tx) => {
        // 0. Bootstrap World for FK constraint
        if (type === "WORLD_CREATED") {
            // We create a shell to satisfy the WorldEvent foreign key.
            // The processor will update this with real data immediately after.
            await tx.world.create({
                data: {
                    id: worldId,
                    title: "Pending Initialization...",
                },
            });
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
                // optional legacy fields can be null
            },
        });

        // 2. Apply Projection (Processors)
        await processEvent(tx, event);

        return event;
    });
}
