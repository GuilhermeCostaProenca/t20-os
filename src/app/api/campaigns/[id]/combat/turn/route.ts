import { prisma } from "@/lib/prisma";
import { CombatTurnSchema } from "@/lib/validators";
import { appendWorldEventFromCombatEvent } from "@/lib/world-events";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function POST(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    const payload = await req.json();
    const parsed = CombatTurnSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: id },
      include: { combatants: { orderBy: { initiative: "desc" } } },
    });
    if (!combat) {
      const message = "Combate nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
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

    const event = await prisma.combatEvent.create({
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

    await appendWorldEventFromCombatEvent(event, {
      campaignId: combat.campaignId,
      combatId: combat.id,
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/campaigns/[id]/combat/turn", error);
    const message = "Nao foi possivel avancar o turno.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
