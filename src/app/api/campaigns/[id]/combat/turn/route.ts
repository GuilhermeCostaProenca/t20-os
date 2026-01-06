import { prisma } from "@/lib/prisma";
import { CombatTurnSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatTurnSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: params.id },
      include: { combatants: { orderBy: { initiative: "desc" } } },
    });
    if (!combat) {
      return Response.json({ error: "Combate não encontrado" }, { status: 404 });
    }

    const total = combat.combatants.length || 1;
    let turnIndex = combat.turnIndex ?? 0;
    let round = combat.round ?? 1;

    if (parsed.direction === "next") {
      turnIndex = (turnIndex + 1) % total;
      if (turnIndex === 0) round += 1;
    } else {
      turnIndex = (turnIndex - 1 + total) % total;
      if (turnIndex === total - 1) round = Math.max(1, round - 1);
    }

    const updated = await prisma.combat.update({
      where: { id: combat.id },
      data: { turnIndex, round },
    });

    await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName:
          combat.combatants[turnIndex]?.name ??
          combat.combatants[0]?.name ??
          "Turno",
        type: "TURN",
        visibility: "PLAYERS",
        payloadJson: { round, turnIndex },
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat/turn", error);
    return Response.json(
      { error: "Não foi possível avançar o turno." },
      { status: 500 }
    );
  }
}
