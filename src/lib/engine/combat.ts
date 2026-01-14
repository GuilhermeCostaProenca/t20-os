import { prisma } from "@/lib/prisma";
import { WorldEventType } from "@prisma/client";
import { dispatchEvent } from "@/lib/events/dispatcher";

// Types
export type CombatState = {
    id: string;
    isActive: boolean;
    round: number;
    turnIndex: number;
    combatants: CombatantState[];
};

export type CombatantState = {
    id: string;
    name: string;
    initiative: number;
    hp: { current: number; max: number };
    condition?: string;
};

// --- Actions ---

/**
 * Starts a new combat for the campaign.
 * If one exists and is active, returns it.
 */
export async function startCombat(campaignId: string) {
    // Check existing
    const existing = await prisma.combat.findUnique({
        where: { campaignId },
        include: { combatants: true },
    });

    if (existing && existing.isActive) {
        return existing;
    }

    // Create new (or reset existing)
    const combat = await prisma.combat.upsert({
        where: { campaignId },
        update: { isActive: true, round: 1, turnIndex: 0 },
        create: { campaignId, isActive: true, round: 1, turnIndex: 0 },
    });

    // Track Event
    await dispatchEvent({
        type: "COMBAT_STARTED" as WorldEventType, // Cast until generated
        campaignId,
        worldId: (await getCampaignWorldId(campaignId)),
        entityId: combat.id,
        payload: { round: 1 },
    });

    return combat;
}

/**
 * Rolls initiative for ALL active combatants (Characters + NPCs in session).
 * For MVP, we will pull ALL characters in the campaign.
 * Future: Only those "In Scene".
 */
export async function rollInitiative(campaignId: string) {
    const combat = await prisma.combat.findUnique({ where: { campaignId } });
    if (!combat) throw new Error("Combat not started");

    // Fetch Candidates (Characters) - MVP: Fetch all in campaign
    const characters = await prisma.character.findMany({
        where: { campaignId },
        select: {
            id: true, name: true,
            // @ts-ignore: Pending schema generation
            attributes: true
        } // Assuming 'attributes' JSON exists now
    });

    // Fetch NPCs? (MVP: Maybe just Characters first)

    // Clear old combatants
    await prisma.combatant.deleteMany({ where: { combatId: combat.id } });

    // Roll and Create
    const newCombatants = [];

    for (const char of characters) {
        // @ts-ignore: Pending schema generation
        const dex = (char.attributes as any)?.dex || 0;
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + dex;

        const c = await prisma.combatant.create({
            data: {
                combatId: combat.id,
                kind: "CHARACTER",
                refId: char.id,
                name: char.name,
                initiative: total,
                hpCurrent: 10, // Placeholder
                hpMax: 10,
            }
        });

        newCombatants.push(c);

        // Dispatch Event
        await dispatchEvent({
            type: "INITIATIVE" as WorldEventType,
            campaignId,
            worldId: (await getCampaignWorldId(campaignId)),
            entityId: char.id,
            payload: { name: char.name, roll, total, dex }
        });
    }

    return newCombatants.sort((a, b) => b.initiative - a.initiative);
}

/**
 * Advances to the next turn.
 */
export async function nextTurn(campaignId: string) {
    const combat = await prisma.combat.findUnique({
        where: { campaignId },
        include: { combatants: { orderBy: { initiative: 'desc' } } }
    });
    if (!combat || !combat.isActive) throw new Error("Combat inactive");

    let nextIndex = combat.turnIndex + 1;
    let nextRound = combat.round;

    if (nextIndex >= combat.combatants.length) {
        nextIndex = 0;
        nextRound++;
    }

    const updated = await prisma.combat.update({
        where: { id: combat.id },
        data: { turnIndex: nextIndex, round: nextRound }
    });

    // Notify
    const currentActor = combat.combatants[nextIndex];
    if (currentActor) {
        await dispatchEvent({
            type: "TURN" as WorldEventType,
            campaignId,
            worldId: (await getCampaignWorldId(campaignId)),
            entityId: currentActor.id,
            payload: {
                round: nextRound,
                actorName: currentActor.name,
                actorId: currentActor.refId
            }
        });
    }

    return updated;
}

/**
 * Ends Combat
 */
export async function endCombat(campaignId: string) {
    const combat = await prisma.combat.findUnique({ where: { campaignId } });
    if (!combat) return;

    await prisma.combat.update({
        where: { id: combat.id },
        data: { isActive: false }
    });

    await dispatchEvent({
        type: "COMBAT_ENDED" as WorldEventType,
        campaignId,
        worldId: (await getCampaignWorldId(campaignId)),
        entityId: combat.id,
        payload: { durationRounds: combat.round }
    });
}


// --- Helpers ---
async function getCampaignWorldId(campaignId: string) {
    const c = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { worldId: true } });
    return c?.worldId || "";
}
