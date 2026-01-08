import { prisma } from "@/lib/prisma";
import { CombatAttackFromSheetSchema } from "@/lib/validators";
import { getRuleset } from "@/rulesets";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = CombatAttackFromSheetSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { id: parsed.combatId },
      include: {
        combatants: true,
        campaign: { select: { rulesetId: true } },
      },
    });
    if (!combat) {
      const message = "Combate nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const attacker = combat.combatants.find((c) => c.id === parsed.attackerCombatantId);
    const target = combat.combatants.find((c) => c.id === parsed.targetCombatantId);
    if (!attacker || !target) {
      const message = "Atacante ou alvo nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    if (attacker.kind !== "CHARACTER") {
      const message = "Apenas personagens vinculados tem ficha automatica.";
      return Response.json({ error: message, message }, { status: 400 });
    }

    const sheet = await prisma.characterSheet.findUnique({
      where: { characterId: attacker.refId },
    });

    const ruleset = getRuleset(combat.campaign?.rulesetId);
    const sheetData = sheet ?? {};
    const attacks = Array.isArray((sheetData as any)?.attacks) ? (sheetData as any).attacks : [];
    const selectedAttack =
      (parsed.attackId && attacks.find((a: any) => a.id === parsed.attackId || a.name === parsed.attackId)) ||
      attacks[0];

    const toHit = ruleset.computeAttack({ sheet: sheetData, attack: selectedAttack });
    const damage = ruleset.computeDamage({
      sheet: sheetData,
      attack: selectedAttack,
      isCrit: Boolean(toHit.isCritThreat && toHit.isNat20),
    });

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
          attackId: selectedAttack?.id,
          attackName: selectedAttack?.name,
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
        attack: selectedAttack,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/combat/attack-from-sheet", error);
    const message = "Falha ao rolar ataque.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}