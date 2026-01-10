import { WorldEventType } from "@prisma/client";

export type TimelineGroupType = 'CombatRound' | 'Exploration' | 'System';

export interface TimelineEvent {
    id: string;
    type: string; // WorldEventType or string
    ts: Date;
    payload: any;
    actorName?: string;
}

export interface TimelineGroup {
    id: string;
    type: TimelineGroupType;
    title: string;
    startTime: Date;
    endTime: Date;
    events: TimelineEvent[];
    meta?: any; // e.g. Round Number
}

/**
 * Groups a raw list of events into semantic clusters.
 * - Combat events are grouped by ROUND.
 * - Chat/Story events are grouped by TIME (e.g. 10 min window).
 */
export function groupEvents(rawEvents: TimelineEvent[]): TimelineGroup[] {
    const sorted = [...rawEvents].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const groups: TimelineGroup[] = [];

    let currentGroup: TimelineGroup | null = null;

    for (const event of sorted) {
        if (event.type === 'COMBAT_STARTED' || event.type === 'COMBAT_START') {
            // Start a new Combat Group
            finalizeGroup(groups, currentGroup);
            currentGroup = createGroup('CombatRound', "Combate - Round 1", event);
            currentGroup.meta = { round: 1 };
        } else if (event.type === 'TURN_CHANGE' || event.type === 'TURN') {
            // Check if round changed
            const newRound = event.payload?.round || 1;
            if (currentGroup && currentGroup.type === 'CombatRound' && currentGroup.meta?.round !== newRound) {
                // Close old round, start new
                finalizeGroup(groups, currentGroup);
                currentGroup = createGroup('CombatRound', `Combate - Round ${newRound}`, event);
                currentGroup.meta = { round: newRound };
            } else if (!currentGroup) {
                // Orphaned turn event
                currentGroup = createGroup('CombatRound', `Combate - Round ${newRound}`, event);
                currentGroup.meta = { round: newRound };
            } else {
                // Just add to current round
                currentGroup.events.push(event);
                currentGroup.endTime = new Date(event.ts);
            }
        } else if (event.type === 'COMBAT_ENDED') {
            if (currentGroup) {
                currentGroup.events.push(event);
                currentGroup.endTime = new Date(event.ts);
                finalizeGroup(groups, currentGroup);
                currentGroup = null;
            } else {
                // Standalone end
                const g = createGroup('System', 'Fim de Combate', event);
                finalizeGroup(groups, g);
            }
        } else {
            // General Events (Chat, Rolls, etc.)
            // If we are in Combat, added to Combat.
            // If not, bucket by time.
            if (currentGroup && currentGroup.type === 'CombatRound') {
                currentGroup.events.push(event);
                currentGroup.endTime = new Date(event.ts);
            } else {
                // Exploration Grouping
                // If current group is Exploration and gap < 15 mins, append.
                const GAP_MS = 15 * 60 * 1000;
                if (currentGroup && currentGroup.type === 'Exploration' &&
                    (new Date(event.ts).getTime() - currentGroup.endTime.getTime() < GAP_MS)) {
                    currentGroup.events.push(event);
                    currentGroup.endTime = new Date(event.ts);
                } else {
                    finalizeGroup(groups, currentGroup);
                    currentGroup = createGroup('Exploration', 'Exploração', event);
                }
            }
        }
    }

    finalizeGroup(groups, currentGroup);

    // Return reverse chronological (newest first)
    return groups.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

function createGroup(type: TimelineGroupType, title: string, firstEvent: TimelineEvent): TimelineGroup {
    return {
        id: `group-${firstEvent.id}`,
        type,
        title,
        startTime: new Date(firstEvent.ts),
        endTime: new Date(firstEvent.ts),
        events: [firstEvent]
    };
}

function finalizeGroup(list: TimelineGroup[], group: TimelineGroup | null) {
    if (group) list.push(group);
}
