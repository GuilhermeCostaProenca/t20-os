import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const tokens = await prisma.mapToken.findMany({
            where: { campaignId: params.id },
        });

        const pins = await prisma.mapPin.findMany({
            where: { campaignId: params.id },
        });

        return Response.json({ tokens, pins });
    } catch (error) {
        console.error("GET /api/campaigns/[id]/map", error);
        return Response.json({ error: "Failed to load map state" }, { status: 500 });
    }
}
