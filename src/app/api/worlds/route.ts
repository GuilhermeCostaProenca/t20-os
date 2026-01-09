import { prisma } from "@/lib/prisma";
import { WorldCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";

export async function GET() {
  try {
    const worlds = await prisma.world.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: worlds });
  } catch (error) {
    console.error("GET /api/worlds", error);
    const message = "Não foi possível listar mundos.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = WorldCreateSchema.parse(payload);

    // Generate ID and Dispatch Event
    const { createId } = await import("@paralleldrive/cuid2");
    const worldId = createId();

    await dispatchEvent({
      type: WorldEventType.WORLD_CREATED,
      worldId: worldId,
      entityId: worldId,
      payload: {
        title: parsed.title,
        description: parsed.description,
        coverImage: parsed.coverImage,
      },
    });

    const world = await prisma.world.findUnique({
      where: { id: worldId },
    });

    return Response.json({ data: world }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }

    console.error("POST /api/worlds", error);
    const message = "Não foi possível criar o mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
