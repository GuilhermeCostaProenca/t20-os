import { prisma } from "@/lib/prisma";
import { SessionCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const worldId = searchParams.get("worldId") || undefined;
    const campaignId = searchParams.get("campaignId") || undefined;

    const where: Record<string, any> = {};
    if (worldId) where.worldId = worldId;
    if (campaignId) where.campaignId = campaignId;

    try {
        const sessions = await prisma.session.findMany({
            where: Object.keys(where).length ? where : undefined,
            orderBy: { scheduledAt: "desc" },
            include: { campaign: { select: { id: true, name: true } } },
        });
        return Response.json({ data: sessions });
    } catch (error) {
        console.error("GET /api/sessions", error);
        return Response.json({ error: "Erro ao listar sessoes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Validate schema
        const parsed = SessionCreateSchema.parse(body);

        if (!body.worldId || !body.campaignId) {
            return Response.json({ error: "Missing worldId or campaignId" }, { status: 400 });
        }

        const session = await prisma.session.create({
            data: {
                ...parsed,
                worldId: body.worldId,
                campaignId: body.campaignId,
            },
        });

        return Response.json({ data: session });
    } catch (error) {
        if (error instanceof ZodError) {
            return Response.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("POST /api/sessions", error);
        return Response.json({ error: "Erro ao criar sessao" }, { status: 500 });
    }
}
