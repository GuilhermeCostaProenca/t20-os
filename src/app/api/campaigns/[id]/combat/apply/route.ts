import { prisma } from "@/lib/prisma";
import { CombatApplySchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatApplySchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: params.id },
      include: { combatants: true },
    });
    if (!combat) {
      return Response.json({ error: "Combate não encontrado" }, { status: 404 });
    }

    const target = combat.combatants.find((c) => c.id === parsed.targetId);
    if (!target) {
      return Response.json({ error: "Alvo não encontrado" }, { status: 404 });
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

    await prisma.combatEvent.create({
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

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat/apply", error);
    return Response.json(
      { error: "Não foi possível aplicar a alteração." },
      { status: 500 }
    );
  }
}
