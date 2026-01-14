import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();

        // Validate body (simple check)
        if (!body.x || !body.y) { // id is optional for new tokens
            return Response.json({ error: "Missing x/y coordinates" }, { status: 400 });
        }

        const token = await prisma.mapToken.upsert({
            where: { id: body.id || "new" }, // Use "new" or a placeholder if creating, but actually upsert needs a valid where.
            // Better strategy: Check if ID exists, or use create if no ID. Upsert requires unique ID.
            // If we don't have an ID from client, we are creating. 
            // If we have an ID, we update.
            create: {
                campaignId: params.id,
                x: body.x,
                y: body.y,
                // Optional fields
                scale: body.scale || 1,
                rotation: body.rotation || 0,
                type: body.type || "character",
                label: body.label,
                imageUrl: body.imageUrl,
                referenceId: body.referenceId,
                status: body.status || "active",
            },
            update: {
                x: body.x,
                y: body.y,
                scale: body.scale,
                rotation: body.rotation,
                status: body.status,
            }
        });

        return Response.json({ data: token });
    } catch (error) {
        console.error("POST /api/campaigns/[id]/map/token", error);
        return Response.json({ error: "Failed to save token" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return Response.json({ error: "ID required" }, { status: 400 });

        await prisma.mapToken.delete({
            where: { id }
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: "Failed to delete" }, { status: 500 });
    }
}
