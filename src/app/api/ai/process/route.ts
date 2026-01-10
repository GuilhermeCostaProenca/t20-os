import { prisma } from "@/lib/prisma";
import { analyzeNarration } from "@/lib/ai/scribe";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text, worldId, campaignId } = body;

        if (!text || !worldId) {
            return Response.json({ error: "Missing text or worldId" }, { status: 400 });
        }

        // 1. Build Context
        const [characters, npcs] = await Promise.all([
            prisma.character.findMany({
                where: { worldId },
                select: { id: true, name: true }
            }),
            prisma.npc.findMany({
                where: { worldId },
                select: { id: true, name: true }
            })
        ]);

        // 2. Analyze
        const events = await analyzeNarration(text, {
            worldId,
            campaignId,
            characters,
            npcs
        });

        // 3. Dispatch Events
        const dispatched = [];
        for (const ev of events) {
            // Basic validation/mapping
            let type = ev.type;
            // Fallback for types that might not match exact Enum
            if (!Object.values(WorldEventType).includes(type)) {
                type = "NOTE";
            }

            const result = await dispatchEvent({
                type: type as WorldEventType,
                worldId,
                campaignId,
                payload: {
                    ...ev.payload,
                    text: ev.description // Canonical text
                },
                actorId: 'AI_SCRIBE'
            });
            dispatched.push(result);
        }

        return Response.json({ data: dispatched, count: dispatched.length });
    } catch (error) {
        console.error("AI Process Error", error);
        return Response.json({ error: "Failed to process text" }, { status: 500 });
    }
}
