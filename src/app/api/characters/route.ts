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

    const withSheet = searchParams.get("withSheet") === "true";

    const characters = await prisma.character.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        campaign: { select: { id: true, name: true } },
        sheet: withSheet ? true : false,
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: characters });
  } catch (error) {
    console.error("GET /api/characters", error);
    const message = "Nao foi possivel listar personagens.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body.worldId || !body.campaignId || !body.name) {
      return Response.json({ error: "Missing required fields (worldId, campaignId, name)" }, { status: 400 });
    }

    const character = await prisma.character.create({
      data: {
        worldId: body.worldId,
        campaignId: body.campaignId,
        name: body.name,
        ancestry: body.ancestry,
        className: body.className,
        level: body.level || 1,
        // @ts-ignore: Fields not yet in generated client
        attributes: body.attributes,
        // @ts-ignore
        stats: body.stats,
        // @ts-ignore
        skills: body.skills,
        // @ts-ignore
        inventory: body.inventory || [],
      },
    });

    return Response.json({ data: character }, { status: 201 });
  } catch (error) {
    console.error("POST /api/characters", error);
    const message = "Nao foi possivel criar o personagem.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}