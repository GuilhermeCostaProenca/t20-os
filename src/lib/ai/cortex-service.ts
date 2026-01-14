import { prisma } from "@/lib/prisma";

export async function getCombatContext(campaignId: string) {
    const combat = await prisma.combat.findUnique({
        where: { campaignId },
        include: {
            combatants: {
                select: {
                    id: true,
                    name: true,
                    kind: true,
                    refId: true,
                    hpCurrent: true,
                    hpMax: true,
                }
            }
        }
    });

    if (!combat) return null;

    return {
        combatId: combat.id,
        round: combat.round,
        combatants: combat.combatants.map(c => ({
            name: c.name,
            id: c.id,
            kind: c.kind, // CHARACTER or NPC
            status: c.hpCurrent <= 0 ? "DOWN" : "OK"
        }))
    };
}

export async function getCampaignContext(roomCodeOrId: string) {
    // Try to find by ID first
    let campaign = await prisma.campaign.findUnique({
        where: { id: roomCodeOrId },
        select: { id: true, worldId: true }
    });

    if (!campaign) {
        // Try by roomCode
        campaign = await prisma.campaign.findUnique({
            where: { roomCode: roomCodeOrId.toUpperCase() },
            select: { id: true, worldId: true }
        });
    }

    return campaign;
}

export async function getLoreContext(campaignId: string, query: string) {
    // Basic RAG-lite: Fetch recent notes and NPCs and filter by query keywords

    // 1. Fetch NPCs
    const npcs = await prisma.npc.findMany({
        where: { campaignId },
        take: 10,
        select: { name: true, description: true, type: true }
    });

    // 2. Fetch Notes (Events)
    // Using simple types for now, need to import WorldEventType if we want to be strict,
    // but Prisma uses string enums at runtime so this works if string matches.
    const recentEvents = await prisma.worldEvent.findMany({
        where: {
            campaignId,
            type: { in: ["NOTE", "LOCATION_DISCOVERY", "NPC_MENTION"] }
        },
        orderBy: { ts: "desc" },
        take: 5
    });

    return {
        npcs: npcs.map(n => `${n.name} (${n.type}): ${n.description || "N/A"}`).join("\n"),
        recentNotes: recentEvents.map(e => JSON.stringify(e.payload)).join("\n")
    };
}
