import { dispatchEvent } from "../src/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

async function main() {
    const worldId = "bpbf1xq5hh7mjxsx3ligqfh9"; // ID from logs
    const campaignId = createId();

    console.log(`Starting debug creation for World: ${worldId}`);

    try {
        const event = await dispatchEvent({
            type: WorldEventType.CAMPAIGN_CREATED,
            worldId: worldId,
            entityId: campaignId,
            campaignId: campaignId,
            payload: {
                name: "Debug Campaign " + Date.now(),
                description: "Created via debug script",
                system: "TORMENTA_20",
                rulesetId: "tormenta20",
            },
        });

        console.log("Event dispatched successfully:", event.id);
        console.log("Check database if Campaign exists.");
    } catch (e) {
        console.error("FATAL ERROR in dispatchEvent:", e);
    }
}

main();
