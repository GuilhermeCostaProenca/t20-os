import { Prisma } from "@prisma/client";
import { CharacterCreatedPayload } from "../types";

type Tx = Prisma.TransactionClient;

export async function applyCharacterCreated(tx: Tx, event: any) {
    const payload = event.payload as CharacterCreatedPayload;
    const characterId = event.targetId;

    if (!characterId) {
        throw new Error("Character ID (entityId) is required for creation event");
    }

    // Double check strict relation constraints if needed
    // But standard flow:
    await tx.character.upsert({
        where: { id: characterId },
        update: {
            name: payload.name,
            description: payload.description,
            ancestry: payload.ancestry || "Humano",
            className: payload.className || "Guerreiro",
            role: payload.role || "Combatente",
            level: payload.level ?? 1,
            avatarUrl: payload.avatarUrl,
        },
        create: {
            id: characterId,
            worldId: event.worldId,
            campaignId: event.campaignId,
            name: payload.name,
            description: payload.description,
            ancestry: payload.ancestry || "Humano",
            className: payload.className || "Guerreiro",
            role: payload.role || "Combatente",
            level: payload.level ?? 1,
            avatarUrl: payload.avatarUrl,
        },
    });
}
