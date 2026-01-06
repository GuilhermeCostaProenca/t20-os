import { prisma } from "@/lib/prisma";
import { CombatAttackFromSheetSchema } from "@/lib/validators";
import { computeAttackRoll, computeDamage } from "@/lib/t20/combat";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = CombatAttackFromSheetSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { id: parsed.combatId },
      include: { combatants: true },
    });
    if (!combat) {
      return Response.json({ error: "Combate não encontrado" }, { status: 404 });
    }

    const attacker = combat.combatants.find((c) => c.id === parsed.attackerCombatantId);
    const target = combat.combatants.find((c) => c.id === parsed.targetCombatantId);
    if (!attacker || !target) {
      return Response.json({ error: "Atacante ou alvo não encontrado" }, { status: 404 });
    }

    if (attacker.kind !== "CHARACTER") {
      return Response.json(
        { error: "Apenas personagens vinculados têm ficha automática" },
        { status: 400 }
      );
    }

    const sheet = await prisma.characterSheet.findUnique({
      where: { characterId: attacker.refId },
    });

    const fallback = {
      for: 10,
      attackBonus: 0,
      damageFormula: "1d6",
      critRange: 20,
      critMultiplier: 2,
    };

    const data = sheet ?? fallback;

    const toHit = computeAttackRoll({
      for: data.for ?? 10,
      attackBonus: data.attackBonus ?? 0,
      damageFormula: data.damageFormula ?? "1d6",
      critRange: data.critRange ?? 20,
      critMultiplier: data.critMultiplier ?? 2,
    });

    const damage = computeDamage(
      {
        for: data.for ?? 10,
        attackBonus: data.attackBonus ?? 0,
        damageFormula: data.damageFormula ?? "1d6",
        critRange: data.critRange ?? 20,
        critMultiplier: data.critMultiplier ?? 2,
      },
      toHit.isCritThreat && toHit.isNat20
    );

    await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: attacker.name,
        type: "ATTACK",
        visibility: "MASTER",
        payloadJson: {
          attackerId: attacker.id,
          targetId: target.id,
          toHit,
          damage,
          source: "sheet",
        },
      },
    });

    return Response.json({
      data: {
        toHit,
        damage,
        attacker: attacker.name,
        target: target.name,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/combat/attack-from-sheet", error);
    return Response.json({ error: "Falha ao rolar ataque." }, { status: 500 });
  }
}
