import { prisma } from "@/lib/prisma";
import { CombatActionSchema } from "@/lib/validators";
import { rollD20, rollFormula } from "@/lib/t20/dice";
import { clamp } from "@/lib/t20/modifiers";
import { getRuleset } from "@/rulesets";
import { ZodError } from "zod";

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CombatActionSchema.parse(payload);

    const combat = await prisma.combat.findUnique({
      where: { campaignId: params.id },
      include: {
        combatants: true,
        campaign: { select: { rulesetId: true } },
      },
    });
    if (!combat) {
      return Response.json({ error: "Combate nao encontrado" }, { status: 404 });
    }

    const ruleset = getRuleset(combat.campaign?.rulesetId);
    const attacker = combat.combatants.find((c) => c.id === parsed.actorId);
    const target = combat.combatants.find((c) => c.id === parsed.targetId);

    const sheet =
      attacker?.kind === "CHARACTER" && attacker.refId
        ? await prisma.characterSheet.findUnique({ where: { characterId: attacker.refId } })
        : null;

    const attacks = Array.isArray((sheet as any)?.attacks) ? (sheet as any).attacks : [];
    const spells = Array.isArray((sheet as any)?.spells) ? (sheet as any).spells : [];
    const skills = Array.isArray((sheet as any)?.skills) ? (sheet as any).skills : [];

    let toHit: any = null;
    let damage: any = null;
    let costMp = parsed.costMp ?? 0;
    let attackUsed: any = null;
    let spellUsed: any = null;
    let skillUsed: any = null;

    if (parsed.kind === "ATTACK") {
      attackUsed =
        (parsed.attackId && attacks.find((a: any) => a.id === parsed.attackId || a.name === parsed.attackId)) ||
        attacks[0];
      if (parsed.useSheet !== false && attackUsed) {
        toHit = ruleset.computeAttack({ sheet: sheet ?? {}, attack: attackUsed });
        damage = ruleset.computeDamage({
          sheet: sheet ?? {},
          attack: attackUsed,
          isCrit: Boolean(toHit.isCritThreat && toHit.isNat20),
        });
      } else {
        toHit = rollD20(parsed.toHitMod ?? 0);
        damage = parsed.damageFormula ? rollFormula(parsed.damageFormula) : null;
      }
    } else if (parsed.kind === "SPELL") {
      spellUsed =
        (parsed.spellId && spells.find((s: any) => s.id === parsed.spellId || s.name === parsed.spellId)) ||
        spells[0];
      const costParsed =
        parsed.costMp ??
        (spellUsed?.cost
          ? typeof spellUsed.cost === "number"
            ? spellUsed.cost
            : Number(spellUsed.cost) || 0
          : 0);
      costMp = costParsed || 0;
      if (parsed.damageFormula) {
        damage = rollFormula(parsed.damageFormula);
      } else if (spellUsed?.damage) {
        damage = rollFormula(spellUsed.damage);
      }
      toHit = rollD20(parsed.toHitMod ?? 0);
    } else if ((parsed as any).kind === "SKILL") {
      skillUsed =
        (parsed.skillId && skills.find((s: any) => s.id === parsed.skillId || s.name === parsed.skillId)) ||
        skills[0];
      const abilityKey = skillUsed?.ability ?? "int";
      const abilityScore = typeof sheet?.[abilityKey] === "number" ? (sheet as any)[abilityKey] : 10;
      const mod =
        ruleset.getAbilityMod(abilityScore) +
        (skillUsed?.bonus ?? 0) +
        (skillUsed?.misc ?? 0) +
        (skillUsed?.ranks ?? 0) +
        (parsed.toHitMod ?? 0);
      toHit = rollD20(mod);
    }

    let updatedTarget = target;
    let updatedAttacker = attacker;

    const targetBefore = target?.hpCurrent;
    const attackerMpBefore = attacker?.mpCurrent;

    if (target && damage?.total) {
      const newHp = clamp(target.hpCurrent + -Math.abs(damage.total), 0, target.hpMax);
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

    const event = await prisma.combatEvent.create({
      data: {
        combatId: combat.id,
        actorName: attacker?.name ?? parsed.actorName,
        type: parsed.kind,
        visibility: parsed.visibility,
        payloadJson: {
          actorId: attacker?.id ?? parsed.actorId,
          actorName: attacker?.name ?? parsed.actorName,
          targetId: target?.id ?? parsed.targetId,
          targetName: target?.name,
          toHit,
          damage,
          damageFormula: parsed.damageFormula,
          kind: parsed.kind,
          attackId: attackUsed?.id,
          attackName: attackUsed?.name,
          spellId: spellUsed?.id,
          spellName: spellUsed?.name,
          skillId: skillUsed?.id,
          skillName: skillUsed?.name,
          costMp,
          deltaHp: damage ? -Math.abs(damage.total ?? 0) : 0,
          hpBefore: targetBefore,
          hpAfter: updatedTarget?.hpCurrent,
          mpBefore: attackerMpBefore,
          mpAfter: updatedAttacker?.mpCurrent,
        },
      },
    });

    return Response.json({
      data: {
        toHit,
        damage,
        event,
        target: updatedTarget,
        attacker: updatedAttacker,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/campaigns/[id]/combat/action", error);
    return Response.json(
      { error: "Nao foi possivel processar a acao." },
      { status: 500 }
    );
  }
}
