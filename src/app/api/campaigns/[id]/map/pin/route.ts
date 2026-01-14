import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();

        // Create new Pin
        const pin = await prisma.mapPin.create({
            data: {
                campaignId: params.id,
                x: body.x,
                y: body.y,
                type: body.type || "poi",
                title: body.title || "Novo Marcador",
                description: body.description,
                color: body.color || "#ffffff",
            }
        });

        return Response.json({ data: pin });
    } catch (error) {
        console.error("POST /api/campaigns/[id]/map/pin", error);
        return Response.json({ error: "Failed to create pin" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: "ID required" }, { status: 400 });

        await prisma.mapPin.delete({
            where: { id }
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: "Failed to delete pin" }, { status: 500 });
    }
}
