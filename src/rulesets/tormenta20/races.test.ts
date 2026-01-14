
import { describe, it, expect } from 'vitest';
import { TORMENTA20_RACES, getTormentaRace } from './races';

describe('Ruleset: Tormenta20 Races', () => {
    it('should retrieve Elf data correctly', () => {
        const elf = getTormentaRace('elfo');
        expect(elf).toBeDefined();
        expect(elf?.name).toBe('Elfo');
        expect(elf?.attributes.int).toBe(4);
        expect(elf?.displacement).toBe(12);
    });

    it('should have basic races defined', () => {
        expect(TORMENTA20_RACES.length).toBeGreaterThan(0);
        const human = TORMENTA20_RACES.find(r => r.id === 'humano');
        expect(human).toBeDefined();
        expect(human?.attributeSelectable).toBe(3);
    });
});
