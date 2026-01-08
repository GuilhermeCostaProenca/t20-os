import { prisma } from "@/lib/prisma";
import { CombatApplySchema } from "@/lib/validators";
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
    const parsed = CombatApplySchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: id },
      include: { combatants: true },
    });
    if (!combat) {
      const message = "Combate nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const target = combat.combatants.find((c) => c.id === parsed.targetId);
    if (!target) {
      const message = "Alvo nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const newHp =
      typeof parsed.deltaHp === "number"
        ? Math.max(0, Math.min(target.hpMax, target.hpCurrent + parsed.deltaHp))
        : target.hpCurrent;
    const newMp =
      typeof parsed.deltaMp === "number"
        ? Math.max(0, Math.min(target.mpMax, target.mpCurrent + parsed.deltaMp))
        : target.mpCurrent;

    const updated = await prisma.combatant.update({
      where: { id: target.id },
      data: { hpCurrent: newHp, mpCurrent: newMp },
    });

    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: target.name,
        type: "OVERRIDE",
        visibility: parsed.visibility,
        payloadJson: {
          targetId: target.id,
          deltaHp: parsed.deltaHp ?? 0,
          deltaMp: parsed.deltaMp ?? 0,
          hpBefore: target.hpCurrent,
          hpAfter: newHp,
          mpBefore: target.mpCurrent,
          mpAfter: newMp,
          note: parsed.note,
        },
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
    console.error("POST /api/campaigns/[id]/combat/apply", error);
    const message = "Nao foi possivel aplicar a alteracao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
