import { prisma } from "@/lib/prisma";
import { CampaignCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

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

    if (roomCode) {
      const campaign = await prisma.campaign.findUnique({
        where: { roomCode },
      });
      return Response.json({ data: campaign ? [campaign] : [] });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: campaigns });
  } catch (error) {
    console.error("GET /api/campaigns", error);
    return Response.json(
      { error: "Não foi possível listar campanhas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = CampaignCreateSchema.parse(payload);
    const rulesetId = parsed.rulesetId ?? "tormenta20";
    const roomCode = await createUniqueRoomCode();

    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        rulesetId,
        roomCode,
      },
    });

    return Response.json({ data: campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("POST /api/campaigns", error);
    return Response.json(
      { error: "Não foi possível criar a campanha." },
      { status: 500 }
    );
  }
}
