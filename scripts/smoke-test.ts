
import { dispatchEvent } from "../src/lib/events/dispatcher";
import { WorldEventType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

async function main() {
    console.log("Starting smoke test...");

    // 1. Create World
    const worldId = createId();
    console.log(`Creating world ${worldId}...`);
    await dispatchEvent({
        type: WorldEventType.WORLD_CREATED,
        worldId,
        entityId: worldId,
        payload: { title: "Smoke World", description: "Testing" }
    });

    // Check DB
    const world = await prisma.world.findUnique({ where: { id: worldId } });
    if (!world) throw new Error("World not projected!");
    console.log("World projected OK");

    // 2. Create Campaign (Should fail without worldId -- handled by type check, but let's assume we pass valid params)
    const campaignId = createId();
    console.log(`Creating campaign ${campaignId}...`);
    await dispatchEvent({
        type: WorldEventType.CAMPAIGN_CREATED,
        worldId,
        entityId: campaignId,
        payload: { name: "Smoke Campaign", system: "TORMENTA_20", rulesetId: "tormenta20" }
    });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error("Campaign not projected!");
    console.log("Campaign projected OK");

    // 3. Create Character
    const charId = createId();
    console.log(`Creating character ${charId}...`);
    await dispatchEvent({
        type: WorldEventType.CHARACTER_CREATED,
        worldId,
        campaignId,
        entityId: charId,
        payload: {
            name: "Smoke Char",
            level: 1,
            ancestry: "Human",
            className: "Warrior",
            role: "Tank"
        }
    });

    const char = await prisma.character.findUnique({ where: { id: charId } });
    if (!char) throw new Error("Character not projected!");
    console.log("Character projected OK");

    console.log("Smoke Test Passed!");

    // Return worldId for use in rebuild test
    console.log(`TEST_WORLD_ID=${worldId}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
