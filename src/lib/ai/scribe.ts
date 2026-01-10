import { openai } from "./client";
import { WorldEventType } from "@prisma/client";

interface ScribeContext {
    worldId: string;
    campaignId: string;
    characters: { id: string; name: string }[];
    npcs: { id: string; name: string }[];
}

export async function analyzeNarration(text: string, context: ScribeContext) {
    const prompt = `
    You are 'The Scribe', an AI assistant for a T20 (Tormenta 20) RPG session.
    Your job is to analyze the following narration text and extract structured Game Events.
    
    Context:
    - Characters: ${context.characters.map(c => c.name).join(", ")}
    - NPCs: ${context.npcs.map(n => n.name).join(", ")}
    
    Rules:
    - Map the narration to one or more events.
    - Event Types: ATTACK, DAMAGE, HEAL, ROLL_DICE, CONDITION_APPLIED, NOTE.
    - If someone attacks, try to identify attacker and target.
    - If damage is dealt, identify target and amount.
    - If a check/roll is asked (e.g., "Roll perception"), use ROLL_DICE.
    - If valid game event is not found, return empty events or a NOTE.
    
    Output Format (JSON only):
    {
      "events": [
        {
          "type": "ATTACK" | "DAMAGE" | ...,
          "payload": { ...specific fields... },
          "description": "Short summary"
        }
      ]
    }
    
    Narration: "${text}"
  `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful RPG system assistant. Output strict JSON." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
    });

    try {
        const content = response.choices[0].message.content || "{}";
        const result = JSON.parse(content);
        return result.events || [];
    } catch (e) {
        console.error("AI Parse error", e);
        return [];
    }
}
