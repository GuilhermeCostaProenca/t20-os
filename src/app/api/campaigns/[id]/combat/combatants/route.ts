import { prisma } from "@/lib/prisma";
import { rollD20 } from "@/lib/t20/dice";
import { CombatantCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

function npcRefId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `npc-${crypto.randomUUID()}`;
  }
  return `npc-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = CombatantCreateSchema.parse(payload);

    const combat = await prisma.combat.upsert({
      where: { campaignId: id },
      update: { isActive: true },
      create: { campaignId: id },
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
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/campaigns/[id]/combat/combatants", error);
    const message = "Nao foi possivel criar o inimigo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
