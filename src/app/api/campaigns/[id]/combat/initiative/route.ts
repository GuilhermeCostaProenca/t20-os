import { prisma } from "@/lib/prisma";
import { CombatInitiativeSchema } from "@/lib/validators";
import { rollD20 } from "@/lib/t20/dice";
import { getRuleset } from "@/rulesets";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatInitiativeSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: params.id },
      include: {
        combatants: true,
        campaign: { select: { rulesetId: true } },
      },
    });
    if (!combat) {
      return Response.json({ error: "Combate não encontrado" }, { status: 404 });
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
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat/initiative", error);
    return Response.json(
      { error: "Não foi possível rolar iniciativa." },
      { status: 500 }
    );
  }
}
