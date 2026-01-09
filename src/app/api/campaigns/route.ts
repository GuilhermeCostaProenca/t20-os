import { prisma } from "@/lib/prisma";
import { CampaignCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateRoomCode();
    const exists = await prisma.campaign.findUnique({
      where: { roomCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Falha ao gerar roomCode");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("roomCode")?.trim().toUpperCase();
    const worldId = searchParams.get("worldId") || undefined;

    if (roomCode) {
      const campaign = await prisma.campaign.findUnique({
        where: { roomCode },
        include: { world: { select: { id: true, title: true } } },
      });
      return Response.json({ data: campaign ? [campaign] : [] });
    }

    const where = worldId ? { worldId } : undefined;
    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { world: { select: { id: true, title: true } } },
    });

    return Response.json({ data: campaigns });
  } catch (error) {
    console.error("GET /api/campaigns", error);
    const message = "Nao foi possivel listar campanhas.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = CampaignCreateSchema.parse(payload);
    const rulesetId = parsed.rulesetId ?? "tormenta20";

    // IDs generated client-side (here in the controller)
    const { createId } = await import("@paralleldrive/cuid2");

    let worldId = parsed.worldId?.trim();

    // 1. Enforce World Existence (World-First)
    if (!worldId) {
      return Response.json({ error: "worldId is required. Create a world first.", message: "worldId is required." }, { status: 400 });
    }

    // Validate world existence
    const existingWorld = await prisma.world.findUnique({
      where: { id: worldId },
      select: { id: true },
    });
    if (!existingWorld) {
      return Response.json({ error: "Mundo não encontrado", message: "Mundo não encontrado" }, { status: 400 });
    }

    // 2. Create Campaign via event
    const campaignId = createId();
    await dispatchEvent({
      type: WorldEventType.CAMPAIGN_CREATED,
      worldId: worldId,
      entityId: campaignId,
      campaignId: campaignId,
      payload: {
        name: parsed.name,
        description: parsed.description,
        system: "TORMENTA_20", // Default or from payload
        rulesetId: rulesetId,
      },
    });

    // 3. Return the Projected Campaign
    // Since dispatchEvent waits for processing, the campaign exists in DB now.
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { world: { select: { id: true, title: true } } },
    });

    return Response.json({ data: campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }

    console.error("POST /api/campaigns", error);
    const message = "Não foi possível criar a campanha.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
