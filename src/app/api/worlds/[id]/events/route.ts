import { prisma } from "@/lib/prisma";
import { WorldEventScope, WorldEventType } from "@prisma/client";

const worldEventTypes = new Set(Object.values(WorldEventType));
const worldEventScopes = new Set(Object.values(WorldEventScope));

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function GET(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope")?.toUpperCase();
    const type = searchParams.get("type")?.toUpperCase();
    const q = searchParams.get("q")?.trim();

    const where: any = { worldId: id };

    if (scope && worldEventScopes.has(scope as WorldEventScope)) {
      where.scope = scope;
    }

    if (type && worldEventTypes.has(type as WorldEventType)) {
      where.type = type;
    }

    if (q) {
      where.text = { contains: q, mode: "insensitive" };
    }

    const events = await prisma.worldEvent.findMany({
      where,
      orderBy: { ts: "desc" },
      take: 200,
    });

    return Response.json({ data: events });
  } catch (error) {
    console.error("GET /api/worlds/[id]/events", error);
    const message = "Nao foi possivel carregar eventos do mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
