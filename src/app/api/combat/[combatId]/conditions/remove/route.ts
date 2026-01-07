import { prisma } from "@/lib/prisma";
import { CombatConditionRemoveSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { combatId: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatConditionRemoveSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { id: params.combatId },
      include: { campaign: { select: { rulesetId: true } } },
    });
    if (!combat) {
      return Response.json({ error: "Combate nao encontrado" }, { status: 404 });
    }

    let appliedConditions = [];
    let condition = null as { id: string; key: string; name: string } | null;

    if (parsed.appliedConditionId) {
      const found = await prisma.appliedCondition.findUnique({
        where: { id: parsed.appliedConditionId },
        include: { condition: true, target: true },
      });
      if (!found || found.combatId !== combat.id) {
        return Response.json({ error: "Condicao aplicada nao encontrada" }, { status: 404 });
      }
      appliedConditions = [found];
      condition = { id: found.condition.id, key: found.condition.key, name: found.condition.name };
    } else {
      if (parsed.conditionId) {
        const found = await prisma.condition.findUnique({ where: { id: parsed.conditionId } });
        if (!found) {
          return Response.json({ error: "Condicao nao encontrada" }, { status: 404 });
        }
        condition = { id: found.id, key: found.key, name: found.name };
      } else if (parsed.conditionKey) {
        const found = await prisma.condition.findUnique({
          where: {
            rulesetId_key: {
              rulesetId: combat.campaign?.rulesetId ?? "tormenta20",
              key: parsed.conditionKey,
            },
          },
        });
        if (!found) {
          return Response.json({ error: "Condicao nao encontrada" }, { status: 404 });
        }
        condition = { id: found.id, key: found.key, name: found.name };
      }

      appliedConditions = await prisma.appliedCondition.findMany({
        where: {
          combatId: combat.id,
          targetCombatantId: parsed.targetCombatantId,
          ...(condition ? { conditionId: condition.id } : {}),
        },
        include: { target: true, condition: true },
      });
    }

    if (!appliedConditions.length) {
      return Response.json({ error: "Nenhuma condicao aplicada encontrada" }, { status: 404 });
    }

    const target = appliedConditions[0].target;
    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: target?.name ?? "Sistema",
        type: "CONDITION_REMOVED",
        visibility: parsed.visibility ?? "MASTER",
        payloadJson: {
          targetId: target?.id,
          targetName: target?.name,
          conditionId: condition?.id ?? appliedConditions[0].conditionId,
          conditionKey: condition?.key ?? appliedConditions[0].condition.key,
          conditionName: condition?.name ?? appliedConditions[0].condition.name,
          removedCount: appliedConditions.length,
        },
      },
    });

    await prisma.appliedCondition.deleteMany({
      where: { id: { in: appliedConditions.map((item) => item.id) } },
    });

    return Response.json({ data: { removed: appliedConditions.length }, event });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/combat/[combatId]/conditions/remove", error);
    return Response.json(
      { error: "Nao foi possivel remover a condicao." },
      { status: 500 }
    );
  }
}
