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
export async function createUniqueRoomCode(tx: Prisma.TransactionClient) {
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

    // If roomCode is not in payload, we check if it already exists or generate new one
    // But since this runs inside a transaction where we might have just created it in dispatcher:
    // We should fetching existing first.

    // Efficiency: We just upsert. If it exists, we keep old roomCode (unless payload forces it?).
    // Payload doesn't have roomCode usually.

    // We need to know if we are creating or updating to handle roomCode generation safely.
    // simpler:
    const existing = await tx.campaign.findUnique({ where: { id: campaignId } });
    let roomCode = existing?.roomCode;

    if (!roomCode) {
        roomCode = await createUniqueRoomCode(tx);
    }

    await tx.campaign.upsert({
        where: { id: campaignId },
        update: {
            name: payload.name,
            description: payload.description,
            system: payload.system,
            rulesetId: payload.rulesetId,
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
