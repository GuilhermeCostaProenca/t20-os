import { prisma } from "@/lib/prisma";
import { dispatchEvent } from "@/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";
import { RollPayload } from "@/lib/events/types";

// Simple Dice Parser for MVP
// Supports "1d20+5", "2d6", etc.
function parseAndRoll(expression: string): { total: number; breakdown: any[] } {
  try {
    const parts = expression.toLowerCase().split('+');
    let total = 0;
    const breakdown = [];

    for (const part of parts) {
      if (part.includes('d')) {
        const [countStr, sidesStr] = part.split('d');
        const count = parseInt(countStr) || 1;
        const sides = parseInt(sidesStr);

        const rolls = [];
        let subtotal = 0;
        for (let i = 0; i < count; i++) {
          const roll = Math.floor(Math.random() * sides) + 1;
          rolls.push(roll);
          subtotal += roll;
        }
        total += subtotal;
        breakdown.push({ type: 'dice', count, sides, rolls, subtotal });
      } else {
        const mod = parseInt(part);
        if (!isNaN(mod)) {
          total += mod;
          breakdown.push({ type: 'mod', value: mod });
        }
      }
    }
    return { total, breakdown };
  } catch (e) {
    console.error("Dice parsing error", e);
    return { total: 0, breakdown: [{ error: "Invalid expression" }] };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { worldId, campaignId, type, payload } = body;

    if (!worldId) {
      return Response.json({ error: "worldId is required" }, { status: 400 });
    }

    let finalPayload: any = payload;
    let eventType: WorldEventType = WorldEventType.NOTE;

    if (type === 'ROLL_DICE') {
      eventType = WorldEventType.ROLL;
      const expression = payload.expression || "1d20";
      const { total, breakdown } = parseAndRoll(expression);

      finalPayload = {
        expression,
        result: total,
        breakdown,
        label: payload.label || "Rolagem",
        isPrivate: payload.isPrivate || false
      };
    } else if (type === 'ATTACK') {
      eventType = WorldEventType.ATTACK;

      const { attackerId, targetId, attackName, attackBonus, damageExpression } = payload;

      // 1. Attack Roll
      const { total: attackTotal, breakdown: attackBreakdown } = parseAndRoll(`1d20+${attackBonus || 0}`);

      let attackResultStr = "Rolou";
      let isHit = false;
      let targetName = "Alvo";
      let damageResult = null;

      // 2. Defense Check (if target exists)
      if (targetId) {
        // Try to find target character or NPC (simplified lookup)
        // Check Character first
        let targetDef = 10;
        const targetChar = await prisma.character.findUnique({
          where: { id: targetId },
          include: { sheet: true }
        });

        if (targetChar) {
          targetName = targetChar.name;
          targetDef = targetChar.sheet?.defenseFinal ?? 10;
        } else {
          // Check NPC
          const targetNpc = await prisma.npc.findUnique({ where: { id: targetId } });
          if (targetNpc) {
            targetName = targetNpc.name;
            targetDef = targetNpc.defenseFinal;
          }
        }

        isHit = attackTotal >= targetDef;
        attackResultStr = isHit ? "ACERTOU" : "ERROU";
      }

      // 3. Damage Roll (if Hit or no target)
      // We roll damage if it hit OR if current logic dictates (e.g. user just wants to see dmg)
      // For functionality, let's roll damage on hit only.
      if (isHit || !targetId) {
        if (damageExpression) {
          damageResult = parseAndRoll(damageExpression);
        }
      }

      finalPayload = {
        attackerId,
        targetId,
        targetName,
        weaponName: attackName || "Ataque",
        roll: {
          result: attackTotal,
          expression: `1d20+${attackBonus}`,
          breakdown: attackBreakdown
        },
        damage: damageResult ? {
          result: damageResult.total,
          expression: damageExpression,
          breakdown: damageResult.breakdown
        } : undefined,
        isHit,
        message: targetId
          ? `${attackResultStr} ${targetName} (Def ${isHit ? '<=' : '>'} ${attackTotal})`
          : `Atacou com ${attackTotal}!`
      };
    } else if (type === 'CHAT') {
      eventType = WorldEventType.NOTE;
      finalPayload = { text: payload.text, author: payload.author };
    }

    // Dispatch to Ledger
    const event = await dispatchEvent({
      type: eventType,
      worldId,
      campaignId,
      actorId: payload.actorId,
      payload: finalPayload,
      scope: type === 'CHAT' ? 'MICRO' : 'MICRO',
      visibility: payload.isPrivate ? 'MASTER' : 'PLAYERS'
    });

    return Response.json({ ok: true, event });
  } catch (error) {
    console.error("Action Error", error);
    return Response.json({ error: "Failed to process action" }, { status: 500 });
  }
}
