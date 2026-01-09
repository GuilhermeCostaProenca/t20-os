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
        { role: { contains: term, mode: "insensitive" } },
      ];
    }

    const characters = await prisma.character.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: characters });
  } catch (error) {
    console.error("GET /api/characters", error);
    const message = "Nao foi possivel listar personagens.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}