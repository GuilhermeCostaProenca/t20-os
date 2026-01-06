import { prisma } from "@/lib/prisma";
import { CombatActionSchema } from "@/lib/validators";
import { rollD20, rollFormula } from "@/lib/t20/dice";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatActionSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: params.id },
      select: { id: true },
    });
    if (!combat) {
      return Response.json({ error: "Combate não encontrado" }, { status: 404 });
    }

    const toHit = rollD20(parsed.toHitMod);
    const dmg = parsed.damageFormula ? rollFormula(parsed.damageFormula) : null;

    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: parsed.actorName,
        type: parsed.kind,
        visibility: parsed.visibility,
        payloadJson: {
          actorId: parsed.actorId,
          targetId: parsed.targetId,
          toHit,
          damage: dmg,
          damageFormula: parsed.damageFormula,
          kind: parsed.kind,
        },
      },
    });

    return Response.json({
      data: {
        toHit,
        damage: dmg,
        event,
        message: `Rolagem ${parsed.kind === "ATTACK" ? "de ataque" : "de magia"}`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat/action", error);
    return Response.json(
      { error: "Não foi possível processar a ação." },
      { status: 500 }
    );
  }
}
