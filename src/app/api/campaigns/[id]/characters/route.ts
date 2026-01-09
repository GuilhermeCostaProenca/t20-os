import { prisma } from "@/lib/prisma";
import { CharacterCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function GET(_req: Request, { params }: RouteContext) {
  let id = "";
  try {
    ({ id } = await params);
    if (!id) return missingId();

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const characters = await prisma.character.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: characters });
  } catch (error) {
    console.error(`GET /api/campaigns/${id || "unknown"}/characters`, error);
    const message = "Nao foi possivel listar personagens.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteContext) {
  let id = "";
  try {
    const { id: campaignId } = await context.params;
    id = campaignId;
    if (!id) return missingId();

    const payload = await req.json();
    const parsed = CharacterCreateSchema.parse(payload);

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, worldId: true },
    });

    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }
    if (!campaign.worldId) {
      const message = "Campanha nao possui mundo associado.";
      return Response.json({ error: message, message }, { status: 400 });
    }

    // Generate ID and Dispatch Event
    const { createId } = await import("@paralleldrive/cuid2");
    const characterId = createId();

    await dispatchEvent({
      type: WorldEventType.CHARACTER_CREATED,
      worldId: campaign.worldId,
      campaignId: id,
      entityId: characterId,
      payload: {
        name: parsed.name,
        description: parsed.description,
        ancestry: parsed.ancestry,
        className: parsed.className,
        role: parsed.role,
        level: parsed.level,
        avatarUrl: parsed.avatarUrl,
        campaignId: id, // Included in payload for processor convenience
      },
    });

    // Return the projected character
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    return Response.json({ data: character }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }

    console.error(`POST /api/campaigns/${id || "unknown"}/characters`, error);
    const message = "Nao foi possivel criar o personagem.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
