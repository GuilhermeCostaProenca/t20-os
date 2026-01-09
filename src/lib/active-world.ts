import { prisma } from "@/lib/prisma";

/**
 * Resolves the active world ID based on the current context.
 * Used for navigation and redirects.
 *
 * Priority:
 * 1. If worldId is explicitly provided, use it
 * 2. If pathname contains /worlds/[id], extract and use it
 * 3. If pathname contains /campaign/[id], get worldId from campaign
 * 4. Fallback to first available world (or null if none exists)
 */
export async function resolveActiveWorldId(
  worldId?: string,
  pathname?: string
): Promise<string | null> {
  // 1. Explicit worldId provided
  if (worldId) {
    return worldId;
  }

  // 2. Extract from pathname if in /app/worlds/[id] route
  if (pathname) {
    const worldsMatch = pathname.match(/^\/app\/worlds\/([^\/]+)/);
    if (worldsMatch?.[1]) {
      return worldsMatch[1];
    }

    // 3. Extract from campaign route and get worldId from campaign
    const campaignMatch = pathname.match(/^\/app\/campaign\/([^\/]+)/);
    if (campaignMatch?.[1]) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignMatch[1] },
        select: { worldId: true },
      });
      if (campaign?.worldId) {
        return campaign.worldId;
      }
    }
  }

  // 4. Fallback: get first available world
  const firstWorld = await prisma.world.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return firstWorld?.id ?? null;
}

/**
 * Client-side version that extracts worldId from pathname only.
 * Use this for navigation/redirects on the client side.
 */
export function extractWorldIdFromPath(pathname: string): string | null {
  const worldsMatch = pathname.match(/^\/app\/worlds\/([^\/]+)/);
  return worldsMatch?.[1] ?? null;
}

/**
 * Extracts campaign ID from pathname and returns it.
 */
export function extractCampaignIdFromPath(pathname: string): string | null {
  const campaignMatch = pathname.match(/^\/app\/campaign\/([^\/]+)/);
  return campaignMatch?.[1] ?? null;
}
