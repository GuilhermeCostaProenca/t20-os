
// Stub for authentication and permissions
// In the future this will integrate with Clerk or NextAuth

import { prisma } from "./prisma";

export async function resolveCurrentUser() {
    // Mock user for MVP Phase
    return {
        id: "user_mvp_gm",
        name: "Game Master",
        role: "GM", // Hardcoded GM for now to allow all actions
        avatarUrl: null
    };
}

export async function checkWorldAccess(worldId: string, userId: string): Promise<"GM" | "PLAYER" | "SPECTATOR" | null> {
    if (!userId) return null;

    // 1. Check if owner
    const world = await prisma.world.findUnique({
        where: { id: worldId },
        select: { ownerId: true }
    });

    // Ensure ownerId is treated as a string for comparison, or fix type if Prisma Client updated
    if (world?.ownerId === userId) return "GM";

    // 2. Check members
    const member = await prisma.worldMember.findUnique({
        where: {
            worldId_userId: { worldId, userId }
        }
    });

    if (member) return member.role;

    // Default to NULL (No Access) unless public world logic exists?
    // For now, if we are in MVP "single user" mode, maybe return GM?
    // Let's keep it strict but fallback for the mock user.
    if (userId === "user_mvp_gm") return "GM";

    return null;
}

export async function assertGmRole(worldId: string) {
    const user = await resolveCurrentUser();
    const access = await checkWorldAccess(worldId, user.id);

    if (access !== "GM") {
        throw new Error("Acesso negado: Requer permissão de Mestre.");
    }
}
