import { prisma } from "@/lib/prisma";
import { NpcCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId") || undefined;
    const worldId = searchParams.get("worldId") || undefined;
    const term = (searchParams.get("term") || "").trim();

    const where: Record<string, any> = {};
    if (campaignId) {
      where.campaignId = campaignId;
    }
    if (worldId) {
      where.worldId = worldId;
    }
    if (term) {
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { tags: { contains: term, mode: "insensitive" } },
      ];
    }

    const npcs = await prisma.npc.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: npcs });
  } catch (error) {
    console.error("GET /api/npcs", error);
    const message = "Nao foi possivel listar NPCs.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = NpcCreateSchema.parse(body);
    // Note: NpcCreateSchema doesn't have worldId/campaignId required explicitly in base, but DB needs them.
    // We should expect them in body and validate or merge.
    // Checking validators.ts: NpcCreateSchema doesn't have worldId. 
    // We might need to extend it or expect it in body.

    // Assuming body has worldId/campaignId. 
    // Wait, Npc model requires campaignId AND worldId.
    if (!body.worldId || !body.campaignId) {
      return Response.json({ error: "Missing worldId or campaignId" }, { status: 400 });
    }

    const created = await prisma.npc.create({
      data: {
        ...parsed,
        worldId: body.worldId,
        campaignId: body.campaignId,
      }
    });

    return Response.json({ data: created });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/npcs", error);
    return Response.json({ error: "Falha ao criar NPC" }, { status: 500 });
  }
}