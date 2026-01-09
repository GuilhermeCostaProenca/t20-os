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

    // --- Action Processing ---
    // In a full system, this would delegate to a Rule Engine.
    // Here we do simple processing before dispatching.

    let finalPayload: any = payload;
    let eventType: WorldEventType = WorldEventType.NOTE; // Default fallback

    if (type === 'ROLL_DICE') {
      eventType = WorldEventType.ROLL;
      const expression = payload.expression || "1d20";
      const { total, breakdown } = parseAndRoll(expression);

      const rollPayload: RollPayload = {
        expression,
        result: total,
        breakdown,
        label: payload.label || "Rolagem",
        isPrivate: payload.isPrivate || false
      };
      finalPayload = rollPayload;
    } else if (type === 'ATTACK') {
      eventType = WorldEventType.ATTACK;
      // TODO: Resolve attack vs AC here?
      // For now, just pass through
      finalPayload = payload;
    } else if (type === 'CHAT') {
      eventType = WorldEventType.NOTE;
      finalPayload = { text: payload.text, author: payload.author };
    }

    // Dispatch to Ledger
    const event = await dispatchEvent({
      type: eventType,
      worldId,
      campaignId,
      actorId: payload.actorId, // If provided
      payload: finalPayload,
      scope: type === 'CHAT' ? 'MICRO' : 'MICRO', // Most play actions are micro
      visibility: payload.isPrivate ? 'MASTER' : 'PLAYERS'
    });

    return Response.json({ ok: true, event });
  } catch (error) {
    console.error("Action Error", error);
    return Response.json({ error: "Failed to process action" }, { status: 500 });
  }
}
