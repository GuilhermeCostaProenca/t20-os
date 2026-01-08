import { prisma } from "@/lib/prisma";
import { CombatInitiativeSchema } from "@/lib/validators";
import { rollD20 } from "@/lib/t20/dice";
import { getRuleset } from "@/rulesets";
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
    const parsed = CombatInitiativeSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: id },
      include: {
        combatants: true,
        campaign: { select: { rulesetId: true } },
      },
    });
    if (!combat) {
      const message = "Combate nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const existingExtras = combat.combatants.filter((c) => c.kind !== "CHARACTER");
    await prisma.combatant.deleteMany({
      where: { combatId: combat.id, kind: "CHARACTER" },
    });

    const ruleset = getRuleset(combat.campaign?.rulesetId);

    const created = [];
    for (const c of parsed.combatants) {
      const mod = ruleset.getAbilityMod((c as any)?.des ?? 10);
      const init = rollD20(mod);
      created.push(
        await prisma.combatant.create({
          data: {
            combatId: combat.id,
            kind: c.kind,
            refId: c.refId,
            name: c.name,
            initiative: init.total,
            hpCurrent: c.hpCurrent ?? c.hpMax ?? 0,
            hpMax: c.hpMax ?? 0,
            mpCurrent: c.mpCurrent ?? c.mpMax ?? 0,
            mpMax: c.mpMax ?? 0,
          },
        })
      );
    }

    const combined = [...existingExtras, ...created];
    const ordered = combined.sort((a, b) => b.initiative - a.initiative);
    return Response.json({ data: ordered });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/campaigns/[id]/combat/initiative", error);
    const message = "Nao foi possivel rolar iniciativa.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}