import { prisma } from "@/lib/prisma";
import { rollD20 } from "@/lib/t20/dice";
import { CombatantCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

function npcRefId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `npc-${crypto.randomUUID()}`;
  }
  return `npc-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatantCreateSchema.parse(payload);

    const combat = await prisma.combat.upsert({
      where: { campaignId: params.id },
      update: { isActive: true },
      create: { campaignId: params.id },
    });

    const initiative = rollD20(0).total;
    const combatant = await prisma.combatant.create({
      data: {
        combatId: combat.id,
        kind: parsed.kind,
        refId: npcRefId(),
        name: parsed.name,
        initiative,
        hpMax: parsed.hpMax,
        hpCurrent: parsed.hpCurrent ?? parsed.hpMax,
        mpMax: 0,
        mpCurrent: 0,
        defenseFinal: parsed.defenseFinal ?? 10,
        attackBonus: parsed.attackBonus ?? 0,
        damageFormula: parsed.damageFormula ?? "1d6",
      },
    });

    return Response.json({ data: combatant }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat/combatants", error);
    return Response.json(
      { error: "Nao foi possivel criar o inimigo." },
      { status: 500 }
    );
  }
}
