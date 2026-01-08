import { prisma } from "@/lib/prisma";
import { ActionRequestCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("roomCode") || undefined;
  const campaignId = searchParams.get("campaignId") || undefined;

  const where = {
    status: "PENDING" as const,
    ...(roomCode ? { roomCode } : {}),
    ...(campaignId ? { campaignId } : {}),
  };

  const requests = await prisma.actionRequest.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return Response.json({ data: requests });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = ActionRequestCreateSchema.parse(payload);

    const created = await prisma.actionRequest.create({
      data: {
        campaignId: parsed.campaignId,
        combatId: parsed.combatId,
        roomCode: parsed.roomCode,
        actorId: parsed.actorId,
        targetId: parsed.targetId,
        type: parsed.type,
        payload: parsed.payload ?? {},
        status: "PENDING",
      },
    });

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/play/action", error);
    const message = "Nao foi possivel criar a acao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
