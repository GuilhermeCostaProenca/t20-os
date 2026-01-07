import { prisma } from "@/lib/prisma";
import { CombatConditionApplySchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { combatId: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatConditionApplySchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { id: params.combatId },
      include: { campaign: { select: { rulesetId: true } } },
    });
    if (!combat) {
      return Response.json({ error: "Combate nao encontrado" }, { status: 404 });
    }

    const target = await prisma.combatant.findUnique({
      where: { id: parsed.targetCombatantId },
    });
    if (!target || target.combatId !== combat.id) {
      return Response.json({ error: "Alvo nao encontrado" }, { status: 404 });
    }

    const condition = parsed.conditionId
      ? await prisma.condition.findUnique({ where: { id: parsed.conditionId } })
      : await prisma.condition.findUnique({
          where: {
            rulesetId_key: {
              rulesetId: combat.campaign?.rulesetId ?? "tormenta20",
              key: parsed.conditionKey ?? "",
            },
          },
        });

    if (!condition) {
      return Response.json({ error: "Condicao nao encontrada" }, { status: 404 });
    }

    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: target.name,
        type: "CONDITION_APPLIED",
        visibility: parsed.visibility ?? "MASTER",
        payloadJson: {
          targetId: target.id,
          targetName: target.name,
          conditionId: condition.id,
          conditionKey: condition.key,
          conditionName: condition.name,
          expiresAtTurn: parsed.expiresAtTurn ?? null,
        },
      },
    });

    const applied = await prisma.appliedCondition.create({
      data: {
        combatId: combat.id,
        targetCombatantId: target.id,
        conditionId: condition.id,
        sourceEventId: event.id,
        expiresAtTurn: parsed.expiresAtTurn ?? null,
      },
    });

    return Response.json({ data: applied, event }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/combat/[combatId]/conditions/apply", error);
    return Response.json(
      { error: "Nao foi possivel aplicar a condicao." },
      { status: 500 }
    );
  }
}
