import { prisma } from "@/lib/prisma";
import { rollD20, rollFormula } from "@/lib/t20/dice";
import { clamp } from "@/lib/t20/modifiers";
import { getRuleset } from "@/rulesets";
import { ActionRequestApplySchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = ActionRequestApplySchema.parse(payload ?? {});

    const request = await prisma.actionRequest.findUnique({ where: { id: params.id } });
    if (!request) {
      return Response.json({ error: "Requisicao nao encontrada" }, { status: 404 });
    }
    if (request.status !== "PENDING") {
      return Response.json({ error: "Requisicao ja processada" }, { status: 400 });
    }

    if (parsed.action === "reject") {
      const rejected = await prisma.actionRequest.update({
        where: { id: params.id },
        data: { status: "REJECTED" },
      });
      return Response.json({ data: rejected });
    }

    const combat = await prisma.combat.findUnique({
      where: { campaignId: request.campaignId },
      include: { combatants: true, campaign: { select: { rulesetId: true } } },
    });
    if (!combat) {
      return Response.json({ error: "Combate nao encontrado" }, { status: 404 });
    }

    const ruleset = getRuleset(combat.campaign?.rulesetId);
    const attacker = combat.combatants.find((c) => c.id === request.actorId);
    const target = combat.combatants.find((c) => c.id === request.targetId);
    if (!attacker || !target) {
      return Response.json({ error: "Ator ou alvo invalido" }, { status: 400 });
    }

    const sheet =
      attacker.kind === "CHARACTER" && attacker.refId
        ? await prisma.characterSheet.findUnique({ where: { characterId: attacker.refId } })
        : null;

    const attacks = Array.isArray((sheet as any)?.attacks) ? (sheet as any).attacks : [];
    const attackId = (request.payload as any)?.attackId;
    const attackUsed =
      (attackId && attacks.find((a: any) => a.id === attackId || a.name === attackId)) || attacks[0];

    const toHit = ruleset.computeAttack({ sheet: sheet ?? {}, attack: attackUsed });
    const damage = ruleset.computeDamage({
      sheet: sheet ?? {},
      attack: attackUsed,
      isCrit: Boolean(toHit.isCritThreat && toHit.isNat20),
    });

    const targetBefore = target.hpCurrent;
    const newHp = clamp(target.hpCurrent + -Math.abs(damage.total ?? 0), 0, target.hpMax);
    const updatedTarget = await prisma.combatant.update({
      where: { id: target.id },
      data: { hpCurrent: newHp },
    });

    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: attacker.name,
        type: "ATTACK",
        visibility: "MASTER",
        payloadJson: {
          actorId: attacker.id,
          actorName: attacker.name,
          targetId: target.id,
          targetName: target.name,
          toHit,
          damage,
          attackId: attackUsed?.id,
          attackName: attackUsed?.name,
          deltaHp: -Math.abs(damage.total ?? 0),
          hpBefore: targetBefore,
          hpAfter: updatedTarget.hpCurrent,
          meta: { campaignId: combat.campaignId, combatId: combat.id },
        },
      },
    });

    await prisma.actionRequest.update({
      where: { id: params.id },
      data: { status: "APPLIED" },
    });

    return Response.json({ data: { event, target: updatedTarget, toHit, damage } });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: error.issues.map((i) => i.message).join(", ") }, { status: 400 });
    }
    console.error("POST /api/play/action/[id]/apply", error);
    return Response.json({ error: "Nao foi possivel aplicar" }, { status: 500 });
  }
}
