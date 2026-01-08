import { prisma } from "@/lib/prisma";
import { CombatConditionRemoveSchema } from "@/lib/validators";
import { appendWorldEventFromCombatEvent } from "@/lib/world-events";
import { ZodError } from "zod";

type Context = { params: { combatId: string } | Promise<{ combatId: string }> };

function missingCombatId() {
  const message = "Parametro combatId obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function POST(req: Request, { params }: Context) {
  let combatId = "";
  try {
    ({ combatId } = await Promise.resolve(params));
    if (!combatId) return missingCombatId();
    const payload = await req.json();
    const parsed = CombatConditionRemoveSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      include: { campaign: { select: { rulesetId: true } } },
    });
    if (!combat) {
      const message = "Combate nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    let appliedConditions = [];
    let condition = null as { id: string; key: string; name: string } | null;

    if (parsed.appliedConditionId) {
      const found = await prisma.appliedCondition.findUnique({
        where: { id: parsed.appliedConditionId },
        include: { condition: true, target: true },
      });
      if (!found || found.combatId !== combat.id) {
        const message = "Condicao aplicada nao encontrada.";
        return Response.json({ error: message, message }, { status: 404 });
      }
      appliedConditions = [found];
      condition = { id: found.condition.id, key: found.condition.key, name: found.condition.name };
    } else {
      if (parsed.conditionId) {
        const found = await prisma.condition.findUnique({ where: { id: parsed.conditionId } });
        if (!found) {
          const message = "Condicao nao encontrada.";
          return Response.json({ error: message, message }, { status: 404 });
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
          const message = "Condicao nao encontrada.";
          return Response.json({ error: message, message }, { status: 404 });
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
      const message = "Nenhuma condicao aplicada encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
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

    await appendWorldEventFromCombatEvent(event, {
      campaignId: combat.campaignId,
      combatId: combat.id,
    });

    await prisma.appliedCondition.deleteMany({
      where: { id: { in: appliedConditions.map((item) => item.id) } },
    });

    return Response.json({ data: { removed: appliedConditions.length }, event });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/combat/[combatId]/conditions/remove", error);
    const message = "Nao foi possivel remover a condicao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
