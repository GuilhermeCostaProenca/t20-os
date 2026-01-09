import { Prisma } from "@prisma/client";
import { CampaignCreatedPayload } from "../types";

type Tx = Prisma.TransactionClient;

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(length = 6) {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
}

// We need to pass tx to check uniqueness
async function createUniqueRoomCode(tx: Tx) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = generateRoomCode();
        const exists = await tx.campaign.findUnique({
            where: { roomCode: code },
            select: { id: true },
        });
        if (!exists) return code;
    }
    throw new Error("Falha ao gerar roomCode unico para campanha");
}

export async function applyCampaignCreated(tx: Tx, event: any) {
    const payload = event.payload as CampaignCreatedPayload;
    const campaignId = event.targetId; // Was entityId

    if (!campaignId) {
        throw new Error("Campaign ID (entityId) is required for creation event");
    }

    const roomCode = await createUniqueRoomCode(tx);

    await tx.campaign.upsert({
        where: { id: campaignId },
        update: {
            name: payload.name,
            description: payload.description,
            system: payload.system,
            rulesetId: payload.rulesetId,
            // roomCode is preserved on update to maintain stability if possible, 
            // or we accept it might rotate if logic dictates. 
            // Ideally roomCode should be in payload, but for now we preserve existing if present.
        },
        create: {
            id: campaignId,
            worldId: event.worldId,
            name: payload.name,
            roomCode,
            system: payload.system ?? "TORMENTA_20",
            rulesetId: payload.rulesetId ?? "tormenta20",
            description: payload.description,
        },
    });
}
