
import { prisma } from "../src/lib/prisma";

async function main() {
    const count = await prisma.worldEvent.count();
    console.log(`Total events: ${count}`);
    const events = await prisma.worldEvent.findMany({ take: 10 });
    console.log("Sample events:", JSON.stringify(events, null, 2));

    const worlds = await prisma.world.findMany();
    console.log(`Total worlds: ${worlds.length}`);
    worlds.forEach(w => console.log(`- ${w.id} (${w.title})`));
}

main().finally(() => prisma.$disconnect());
