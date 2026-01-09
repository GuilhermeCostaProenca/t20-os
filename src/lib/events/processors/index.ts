import { Prisma, WorldEventType } from "@prisma/client";
import { applyWorldCreated } from "./world";
import { applyCampaignCreated } from "./campaign";
import { applyCharacterCreated } from "./character";

// Type for the Prisma Transaction Client
type Tx = Prisma.TransactionClient;

export async function processEvent(tx: Tx, event: any) {
    switch (event.type) {
        case WorldEventType.WORLD_CREATED:
            return applyWorldCreated(tx, event);
        case WorldEventType.CAMPAIGN_CREATED:
            return applyCampaignCreated(tx, event);
        case WorldEventType.CHARACTER_CREATED:
            return applyCharacterCreated(tx, event);
        default:
            // Other events might not need immediate projection or are handled elsewhere
            break;
    }
}
