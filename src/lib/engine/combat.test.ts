
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startCombat, nextTurn, rollInitiative, endCombat } from './combat';
import { prisma } from '@/lib/prisma';
import { dispatchEvent } from '@/lib/events/dispatcher';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        combat: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
        character: {
            findMany: vi.fn(),
        },
        combatant: {
            deleteMany: vi.fn(),
            create: vi.fn(),
        },
        campaign: {
            findUnique: vi.fn(),
        }
    }
}));

vi.mock('@/lib/events/dispatcher', () => ({
    dispatchEvent: vi.fn(),
}));

describe('Combat Engine', () => {
    const mockCampaignId = 'camp-123';
    const mockWorldId = 'world-456';

    beforeEach(() => {
        vi.resetAllMocks();
        (prisma.campaign.findUnique as any).mockResolvedValue({ worldId: mockWorldId });
    });

    describe('startCombat', () => {
        it('should create new combat if none exists', async () => {
            (prisma.combat.findUnique as any).mockResolvedValue(null);
            (prisma.combat.upsert as any).mockResolvedValue({ id: 'combat-1', isActive: true, round: 1 });

            const result = await startCombat(mockCampaignId);

            expect(prisma.combat.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { campaignId: mockCampaignId },
                update: { isActive: true, round: 1, turnIndex: 0 },
            }));
            expect(result.id).toBe('combat-1');
            expect(dispatchEvent).toHaveBeenCalled();
        });

        it('should return existing active combat', async () => {
            (prisma.combat.findUnique as any).mockResolvedValue({ id: 'combat-existing', isActive: true });

            const result = await startCombat(mockCampaignId);

            expect(prisma.combat.upsert).not.toHaveBeenCalled();
            expect(result.id).toBe('combat-existing');
        });
    });

    describe('nextTurn', () => {
        it('should advance turn index', async () => {
            const mockCombat = {
                id: 'combat-1',
                isActive: true,
                turnIndex: 0,
                round: 1,
                combatants: [
                    { id: 'c1', name: 'Char1', initiative: 20 },
                    { id: 'c2', name: 'Char2', initiative: 10 }
                ]
            };
            (prisma.combat.findUnique as any).mockResolvedValue(mockCombat);
            (prisma.combat.update as any).mockResolvedValue({ ...mockCombat, turnIndex: 1 });

            await nextTurn(mockCampaignId);

            expect(prisma.combat.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { turnIndex: 1, round: 1 }
            }));
            expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
                type: "TURN",
                payload: expect.objectContaining({ actorName: 'Char2' })
            }));
        });

        it('should advance round when index overflows', async () => {
            const mockCombat = {
                id: 'combat-1',
                isActive: true,
                turnIndex: 1, // Last one
                round: 1,
                combatants: [
                    { id: 'c1', name: 'Char1' },
                    { id: 'c2', name: 'Char2' }
                ]
            };
            (prisma.combat.findUnique as any).mockResolvedValue(mockCombat);

            await nextTurn(mockCampaignId);

            expect(prisma.combat.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { turnIndex: 0, round: 2 }
            }));
        });
    });

    describe('rollInitiative', () => {
        it('should roll for all characters and sort them', async () => {
            const mockCombat = { id: 'combat-1', isActive: true };
            const mockChars = [
                { id: 'char1', name: 'Rogue', attributes: { dex: 5 } },
                { id: 'char2', name: 'Wizard', attributes: { dex: 0 } }
            ];

            (prisma.combat.findUnique as any).mockResolvedValue(mockCombat);
            (prisma.character.findMany as any).mockResolvedValue(mockChars);

            // Mock random to be deterministic
            // Math.random() * 20 + 1
            // Char1 (Dex 5): Roll 10 -> Total 15
            // Char2 (Dex 0): Roll 20 -> Total 20
            vi.spyOn(Math, 'random')
                .mockReturnValueOnce(0.45) // ~10 (0.45 * 20 = 9 + 1 = 10)
                .mockReturnValueOnce(0.95); // ~20 (0.95 * 20 = 19 + 1 = 20)

            // We need to mock create to return something useful for the sort check
            (prisma.combatant.create as any)
                .mockImplementationOnce(async ({ data }: any) => ({ ...data, id: 'c1' }))
                .mockImplementationOnce(async ({ data }: any) => ({ ...data, id: 'c2' }));

            const results = await rollInitiative(mockCampaignId);

            expect(prisma.combatant.deleteMany).toHaveBeenCalled();
            expect(prisma.combatant.create).toHaveBeenCalledTimes(2);

            // Check sorting (Highest total first)
            // Char1: 10 + 5 = 15
            // Char2: 20 + 0 = 20
            // Expect Char2 then Char1
            expect(results[0].name).toBe('Wizard');
            expect(results[1].name).toBe('Rogue');
        });
    });
});
