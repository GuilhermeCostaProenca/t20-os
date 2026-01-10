import { prisma } from "@/lib/prisma";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";
import { summarizeSession } from "@/lib/summarize";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { worldId, campaignId } = body;

        if (!worldId || !campaignId) {
            return Response.json({ error: "worldId and campaignId required" }, { status: 400 });
        }

        // 1. Fetch recent events (context)
        const recentEvents = await prisma.worldEvent.findMany({
            where: {
                worldId,
                campaignId, // Filter by campaign
                type: { in: [WorldEventType.ROLL, WorldEventType.ATTACK, WorldEventType.NOTE] }
            },
            orderBy: { ts: 'desc' },
            take: 50
        });

        // Reverse to chronological order for summary
        const chronologicalEvents = [...recentEvents].reverse();

        // 2. Generate Summary (Mock AI)
        const summaryData = summarizeSession(chronologicalEvents);

        // Format the text
        const text = `
📜 **Relatório do Escriba**

${summaryData.summary}

**Destaques:**
${summaryData.highlights.map(h => `• ${h}`).join('\n')}
    `.trim();

        // 3. Dispatch Event
        const event = await dispatchEvent({
            type: WorldEventType.NOTE,
            worldId,
            campaignId,
            actorId: 'ai-scribe',
            scope: 'MACRO', // Visible to everyone, important
            visibility: 'PLAYERS',
            payload: {
                text,
                author: "O Escriba",
                isSummary: true
            }
        });

        return Response.json({ ok: true, event });
    } catch (error) {
        console.error("Summarize Error", error);
        return Response.json({ error: "Failed to summarize" }, { status: 500 });
    }
}
