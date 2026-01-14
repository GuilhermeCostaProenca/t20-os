import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const tokens = await prisma.mapToken.findMany({
            where: { campaignId: id },
        });

        const pins = await prisma.mapPin.findMany({
            where: { campaignId: id },
        });

        return Response.json({ tokens, pins });
    } catch (error) {
        console.error("GET /api/campaigns/[id]/map", error);
        return Response.json({ error: "Failed to load map state" }, { status: 500 });
    }
}
