import { normalizeEvent } from "@/lib/events/normalize";
import { EventPayload } from "@/lib/events/types";

export type SessionSummaryPayload = {
  summary: string;
  highlights: string[];
  npcs: string[];
  items: string[];
  hooks: string[];
};

export function summarizeSession(rawEvents: any[]): SessionSummaryPayload {
  const events: EventPayload[] = rawEvents.map((ev) => normalizeEvent(ev));

  if (!events.length) {
    return {
      summary: "Sessão sem eventos registrados.",
      highlights: [],
      npcs: [],
      items: [],
      hooks: [],
    };
  }

  const actors = new Set<string>();
  const targets = new Set<string>();
  const npcsMentioned = new Set<string>();
  const itemsFound = new Set<string>();
  const highlights: string[] = [];

  events.slice(0, 200).forEach((ev) => {
    if (ev.actorName) actors.add(ev.actorName);
    if (ev.targetName) targets.add(ev.targetName);
    const breakdown = ev.breakdown ?? {};
    const note = ev.note ?? ev.message;

    if (ev.type === "NPC_MENTION" && note) npcsMentioned.add(note);
    if (ev.type === "ITEM_MENTION" && note) itemsFound.add(note);
    if (ev.type === "NOTE" && note) highlights.push(`Nota: ${note}`);

    if (breakdown.damage?.total) {
      highlights.push(
        `${ev.actorName ?? "Ator"} causou ${breakdown.damage.total} em ${ev.targetName ?? ev.targetId ?? "alvo"}`
      );
    }

    if (breakdown.toHit?.total) {
      highlights.push(
        `${ev.actorName ?? "Jogador"} rolou ${breakdown.toHit.total}${breakdown.damage?.total ? ` e dano ${breakdown.damage.total}` : ""
        }`
      );
    }
  });

  const actorsList = Array.from(actors);
  const targetsList = Array.from(targets);
  const npcs = Array.from(new Set([...npcsMentioned, ...targetsList])).slice(0, 10);
  const items = Array.from(itemsFound).slice(0, 10);

  const summary = `Sessão com ${events.length} eventos. Participantes: ${actorsList.length ? actorsList.slice(0, 5).join(", ") : "N/D"
    }. Principais alvos: ${targetsList.length ? targetsList.slice(0, 5).join(", ") : "N/D"}.`;

  const hooks = [
    npcs[0] ? `Revisar envolvimento de ${npcs[0]}.` : "Mapear ganchos para a proxima sessao.",
    items[0] ? `Investigar item ${items[0]}.` : undefined,
  ].filter(Boolean) as string[];

  return {
    summary,
    highlights: highlights.slice(0, 8),
    npcs,
    items,
    hooks,
  };
}
