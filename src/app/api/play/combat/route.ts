import { startCombat, rollInitiative, nextTurn, endCombat } from "@/lib/engine/combat";
import { z } from "zod";

const ActionSchema = z.object({
    action: z.enum(["START", "INITIATIVE", "NEXT_TURN", "END"]),
    campaignId: z.string(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, campaignId } = ActionSchema.parse(body);

        let result;

        switch (action) {
            case "START":
                result = await startCombat(campaignId);
                break;
            case "INITIATIVE":
                result = await rollInitiative(campaignId);
                break;
            case "NEXT_TURN":
                result = await nextTurn(campaignId);
                break;
            case "END":
                result = await endCombat(campaignId);
                break;
        }

        return Response.json({ data: result });
    } catch (error) {
        console.error("POST /api/play/combat", error);
        return Response.json(
            { error: "Failed to process combat action", details: String(error) },
            { status: 400 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get("campaignId");
        if (!campaignId) return Response.json({ error: "Missing campaignId" }, { status: 400 });

        const combat = await import("@/lib/prisma").then(m => m.prisma.combat.findUnique({
            where: { campaignId },
            include: { combatants: { orderBy: { initiative: 'desc' } } }
        }));

        return Response.json({ data: combat });
    } catch (e) {
        return Response.json({ error: "Failed to fetch combat" }, { status: 500 });
    }
}
