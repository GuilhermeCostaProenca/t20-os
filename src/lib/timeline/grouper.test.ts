
import { describe, it, expect } from 'vitest';
import { groupEvents, TimelineEvent } from './grouper';

describe('Timeline Grouper', () => {
    const baseTime = new Date('2024-01-01T12:00:00Z').getTime();

    const mkEvent = (offsetMin: number, type: string, payload = {}, idStr = 'ev'): TimelineEvent => ({
        id: `${idStr}-${offsetMin}`,
        type,
        ts: new Date(baseTime + offsetMin * 60000),
        payload
    });

    it('should group close events into Exploration', () => {
        const events = [
            mkEvent(0, 'CHAT'),
            mkEvent(5, 'ROLL'),
            mkEvent(10, 'NOTE'), // 10 mins after start
        ];

        const groups = groupEvents(events);

        expect(groups).toHaveLength(1);
        expect(groups[0].type).toBe('Exploration');
        expect(groups[0].events).toHaveLength(3);
        expect(groups[0].endTime.getTime()).toBe(new Date(baseTime + 10 * 60000).getTime());
    });

    it('should split exploration events with large gaps', () => {
        const events = [
            mkEvent(0, 'CHAT'),
            mkEvent(60, 'CHAT'), // 1 hour later
        ];

        const groups = groupEvents(events);

        expect(groups).toHaveLength(2);
        expect(groups[0].title).toBe('Exploração'); // Newest first (60)
        expect(groups[1].title).toBe('Exploração'); // Oldest last (0)
        // Group 0 is the one at 60min
        expect(groups[0].startTime.getTime()).toBe(new Date(baseTime + 60 * 60000).getTime());
    });

    it('should group combat events by round', () => {
        const events = [
            mkEvent(0, 'COMBAT_STARTED'),
            mkEvent(0.1, 'INITIATIVE'),
            mkEvent(0.2, 'TURN', { round: 1 }), // Round 1
            mkEvent(0.5, 'ATTACK'), // Inside R1
            mkEvent(1, 'TURN', { round: 2 }), // Round 2 Start
            mkEvent(1.2, 'ATTACK'), // Inside R2
            mkEvent(2, 'COMBAT_ENDED')
        ];

        const groups = groupEvents(events);

        // Should have:
        // Group 1: Combat R1 (Start + Init + Turn1 + Attack)
        // Group 2: Combat R2 (Turn2 + Attack + End)
        // Actually, logic puts End in current group.

        // Wait, the sorter returns newest FIRST.
        // So R2 is groups[0], R1 is groups[1].

        expect(groups).toHaveLength(2);

        const r2 = groups[0];
        const r1 = groups[1];

        expect(r1.title).toBe('Combate - Round 1');
        expect(r1.events).toHaveLength(4); // Start, Init, Turn1, Attack

        expect(r2.title).toBe('Combate - Round 2');
        expect(r2.events).toHaveLength(3); // Turn2, Attack, End
    });
});
