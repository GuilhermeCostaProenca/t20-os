import { prisma } from "@/lib/prisma";
import { rollD20, rollFormula } from "@/lib/t20/dice";
import { clamp } from "@/lib/t20/modifiers";
import { getRuleset } from "@/rulesets";
import { ActionRequestApplySchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

type ActionType = "ATTACK" | "SPELL" | "SKILL";

type ConditionRef = {
  id: string;
  key: string;
  name: string;
};

async function loadAppliedConditions(combatId: string, combatantId?: string | null) {
  if (!combatantId) return [];
  return prisma.appliedCondition.findMany({
    where: { combatId, targetCombatantId: combatantId },
    include: { condition: true },
  });
}

async function resolveConditions(
  rulesetId: string,
  conditionIds: string[],
  conditionKeys: string[]
): Promise<ConditionRef[]> {
  const filters: any[] = [];
  if (conditionIds.length) {
    filters.push({ id: { in: conditionIds } });
  }
  if (conditionKeys.length) {
    filters.push({ rulesetId, key: { in: conditionKeys } });
  }
  if (!filters.length) return [];
  const results = await prisma.condition.findMany({ where: { OR: filters } });
  const seen = new Set<string>();
  return results
    .filter((cond) => {
      if (seen.has(cond.id)) return false;
      seen.add(cond.id);
      return true;
    })
    .map((cond) => ({ id: cond.id, key: cond.key, name: cond.name }));
}

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

    const [actorConditions, targetConditions] = await Promise.all([
      loadAppliedConditions(combat.id, attacker.id),
      loadAppliedConditions(combat.id, target.id),
    ]);

    const conditionContext = { actorConditions, targetConditions };

    const sheet =
      attacker.kind === "CHARACTER" && attacker.refId
        ? await prisma.characterSheet.findUnique({ where: { characterId: attacker.refId } })
        : null;

    const attacks = Array.isArray((sheet as any)?.attacks) ? (sheet as any).attacks : [];
    const spells = Array.isArray((sheet as any)?.spells) ? (sheet as any).spells : [];
    const skills = Array.isArray((sheet as any)?.skills) ? (sheet as any).skills : [];

    const actionType = request.type as ActionType;
    const requestPayload = (request.payload ?? {}) as any;

    let toHit: any = null;
    let damage: any = null;
    let costMp = 0;
    let attackUsed: any = null;
    let spellUsed: any = null;
    let skillUsed: any = null;
    let effectsApplied: Array<{ conditionKey?: string; note?: string }> = [];

    if (actionType === "ATTACK") {
      if (attacker.kind === "CHARACTER") {
        attackUsed =
          (requestPayload.attackId &&
            attacks.find((a: any) => a.id === requestPayload.attackId || a.name === requestPayload.attackId)) ||
          attacks[0];
        toHit = ruleset.computeAttack({ sheet: sheet ?? {}, attack: attackUsed, context: conditionContext });
        damage = ruleset.computeDamage({
          sheet: sheet ?? {},
          attack: attackUsed,
          isCrit: Boolean(toHit.isCritThreat && toHit.isNat20),
          context: conditionContext,
        });
      } else {
        attackUsed = {
          name: attacker.name,
          bonus: attacker.attackBonus ?? 0,
          damage: attacker.damageFormula ?? "1d6",
          critRange: 20,
          critMultiplier: 2,
          ability: "for",
        };
        toHit = ruleset.computeAttack({ sheet: {}, attack: attackUsed, context: conditionContext });
        damage = ruleset.computeDamage({
          sheet: {},
          attack: attackUsed,
          isCrit: Boolean(toHit.isCritThreat && toHit.isNat20),
          context: conditionContext,
        });
      }
    }

    if (actionType === "SPELL") {
      spellUsed =
        (requestPayload.spellId &&
          spells.find((s: any) => s.id === requestPayload.spellId || s.name === requestPayload.spellId)) ||
        spells[0];
      if (spellUsed) {
        const spellResult = ruleset.computeSpell({ sheet: sheet ?? {}, spell: spellUsed, context: conditionContext });
        toHit = spellResult.hitOrSaveResult ?? null;
        damage = spellResult.damage ?? null;
        costMp = spellResult.cost?.mp ?? 0;
        effectsApplied = spellResult.effectsApplied ?? [];
      } else if (requestPayload.damageFormula) {
        const conditionMods = ruleset.applyConditionsModifiers({
          ...conditionContext,
          actionType: "SPELL",
        });
        const mod = numberOr(requestPayload.toHitMod, 0) + (conditionMods.spellMod ?? 0);
        const roll = rollD20(mod);
        toHit = {
          d20: roll.d20,
          mod,
          total: roll.total,
          breakdown: `d20=${roll.d20} + ${mod} = ${roll.total}`,
        };
        const raw = rollFormula(requestPayload.damageFormula);
        damage = { ...raw, total: raw.total + (conditionMods.damageMod ?? 0) };
        costMp = numberOr(requestPayload.costMp, 0) + (conditionMods.costMpMod ?? 0);
      }
      costMp = Math.max(0, costMp);
    }

    if (actionType === "SKILL") {
      skillUsed =
        (requestPayload.skillId &&
          skills.find((s: any) => s.id === requestPayload.skillId || s.name === requestPayload.skillId)) ||
        skills[0];
      if (skillUsed) {
        toHit = ruleset.computeSkillCheck({ sheet: sheet ?? {}, skill: skillUsed, context: conditionContext });
      } else {
        const conditionMods = ruleset.applyConditionsModifiers({
          ...conditionContext,
          actionType: "SKILL",
        });
        const mod = numberOr(requestPayload.toHitMod, 0) + (conditionMods.skillMod ?? 0);
        const roll = rollD20(mod);
        toHit = {
          d20: roll.d20,
          mod,
          total: roll.total,
          breakdown: `d20=${roll.d20} + ${mod} = ${roll.total}`,
        };
      }
    }

    if (costMp > 0 && attacker.mpCurrent < costMp) {
      return Response.json({ error: "PM insuficiente" }, { status: 400 });
    }

    const targetBefore = target.hpCurrent;
    const attackerMpBefore = attacker.mpCurrent;
    let updatedTarget = target;
    let updatedAttacker = attacker;

    if (target && damage?.total) {
      const newHp = clamp(target.hpCurrent + -Math.abs(damage.total ?? 0), 0, target.hpMax);
      updatedTarget = await prisma.combatant.update({
        where: { id: target.id },
        data: { hpCurrent: newHp },
      });
    }

    if (attacker && costMp) {
      const newMp = clamp(attacker.mpCurrent - Math.abs(costMp), 0, attacker.mpMax);
      updatedAttacker = await prisma.combatant.update({
        where: { id: attacker.id },
        data: { mpCurrent: newMp },
      });
    }

    const conditionKeys = [
      ...(requestPayload.conditionKeys ?? []),
      ...effectsApplied
        .map((entry) => entry?.conditionKey)
        .filter((key): key is string => Boolean(key)),
    ];
    const conditionIds = requestPayload.conditionIds ?? [];
    const conditionsToApply = await resolveConditions(ruleset.id, conditionIds, conditionKeys);

    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: attacker.name,
        type: actionType,
        visibility: "MASTER",
        payloadJson: {
          actorId: attacker.id,
          actorName: attacker.name,
          targetId: target.id,
          targetName: target.name,
          toHit,
          damage,
          kind: actionType,
          attackId: attackUsed?.id,
          attackName: attackUsed?.name,
          spellId: spellUsed?.id,
          spellName: spellUsed?.name,
          skillId: skillUsed?.id,
          skillName: skillUsed?.name,
          costMp,
          deltaHp: damage ? -Math.abs(damage.total ?? 0) : 0,
          hpBefore: targetBefore,
          hpAfter: updatedTarget.hpCurrent,
          mpBefore: attackerMpBefore,
          mpAfter: updatedAttacker.mpCurrent,
          conditionsApplied: conditionsToApply,
          meta: { campaignId: combat.campaignId, combatId: combat.id },
        },
      },
    });

    if (conditionsToApply.length) {
      await prisma.appliedCondition.createMany({
        data: conditionsToApply.map((condition) => ({
          combatId: combat.id,
          targetCombatantId: target.id,
          conditionId: condition.id,
          sourceEventId: event.id,
        })),
      });
    }

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

function numberOr(value: any, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
