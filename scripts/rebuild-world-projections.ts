
import { prisma } from "../src/lib/prisma";
import { processEvent } from "../src/lib/events/processors";
import { WorldEventType } from "@prisma/client";

async function rebuildWorld(worldId: string) {
    console.log(`\n🔄 Rebuilding projections for World: ${worldId}`);

    // 1. Fetch all events for this world defined by strict ordering criteria
    const events = await prisma.worldEvent.findMany({
        where: { worldId },
        orderBy: [
            { ts: "asc" },
            { id: "asc" },
        ],
    });

    console.log(`Found ${events.length} events.`);

    // 2. Transactionally CORRUPT projections and replay
    await prisma.$transaction(
        async (tx) => {
            console.log("🔥 Corrupting projections to prove reconstruction...");
            // We cannot delete World/Campaign because foreign keys restrict it (Ledger depends on them).
            // So we corrupt them to prove that replay restores correct state.

            const worldExists = await tx.world.findUnique({ where: { id: worldId } });
            if (worldExists) {
                await tx.world.update({
                    where: { id: worldId },
                    data: { title: "CORRUPTED_TITLE", description: "CORRUPTED_DESC" }
                });
                console.log(`- Corrupted World title`);
            }

            await tx.campaign.updateMany({
                where: { worldId },
                data: { name: "CORRUPTED_CAMPAIGN" }
            });
            console.log(`- Corrupted Campaigns`);

            await tx.character.updateMany({
                where: { worldId },
                data: { name: "CORRUPTED_CHAR" }
            });
            console.log(`- Corrupted Characters`);

            console.log("▶️ Replaying events...");
            for (const event of events) {
                // We need to cast payload because Prisma returns it as JsonValue
                const typedEvent = {
                    ...event,
                    payload: event.payload as any,
                    // Ensure targetId is mapped from entityId if missing in older events (backward compat)
                    targetId: event.targetId || (event as any).entityId
                };

                try {
                    await processEvent(tx, typedEvent);
                    process.stdout.write(".");
                } catch (e) {
                    console.error(`\n❌ Failed to process event ${event.id} (${event.type}):`, e);
                    // We do NOT throw here for the script to continue partial rebuilds if desired,
                    // but for "Strict" mode we should probably throw. Let's throw to be safe.
                    throw e;
                }
            }
        },
        {
            maxWait: 5000,
            timeout: 60000, // Increased timeout 
        }
    );

    console.log("\n✅ Rebuild complete.\n");

    // Verification Step
    const world = await prisma.world.findUnique({ where: { id: worldId } });
    const campaigns = await prisma.campaign.count({ where: { worldId } });
    const characters = await prisma.character.count({ where: { worldId } });

    console.log("📊 Post-Rebuild Stats:");
    if (world) {
        console.log(`- World Title: ${world.title}`);
        if (world.title === "CORRUPTED_TITLE") throw new Error("World title was NOT restored!");
    } else {
        throw new Error("World missing!");
    }
}

// CLI Entrypoint
const targetWorldId = process.argv[2];
if (!targetWorldId) {
    console.error("Usage: npx tsx scripts/rebuild-world-projections.ts <worldId>");
    process.exit(1);
}

rebuildWorld(targetWorldId)
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
