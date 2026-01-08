import { prisma } from "@/lib/prisma";
import { CombatConditionApplySchema } from "@/lib/validators";
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
    const parsed = CombatConditionApplySchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      include: { campaign: { select: { rulesetId: true } } },
    });
    if (!combat) {
      const message = "Combate nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const target = await prisma.combatant.findUnique({
      where: { id: parsed.targetCombatantId },
    });
    if (!target || target.combatId !== combat.id) {
      const message = "Alvo nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
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
      const message = "Condicao nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
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
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/combat/[combatId]/conditions/apply", error);
    const message = "Nao foi possivel aplicar a condicao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
