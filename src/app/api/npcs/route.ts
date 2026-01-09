import { prisma } from "@/lib/prisma";

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