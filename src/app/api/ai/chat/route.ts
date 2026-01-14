import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, message, userId, campaignId } = body;

        // If no sessionId, create a NEW session
        let currentSessionId = sessionId;

        if (!currentSessionId) {
            // Generate a Title based on first message (truncated)
            const title = message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "");

            const session = await prisma.aiChatSession.create({
                data: {
                    userId: userId || "guest", // TODO: Auth
                    campaignId: campaignId,
                    title: title
                }
            });
            currentSessionId = session.id;
        }

        // Save User Message
        const userMsg = await prisma.aiChatMessage.create({
            data: {
                sessionId: currentSessionId,
                role: "user",
                content: message.content
            }
        });

        // Trigger AI Processing (Internal Redirect to Command Logic, or just save response if passed)
        // For now, the frontend calls /command -> gets result -> calls /chat to save history.
        // OR: This endpoint handles everything. 
        // BETTER PATTERN: Frontend calls /chat. /chat calls Command Logic internally.
        // But to keep consistency with existing /command, we might just use this for History Persistence ONLY for now, 
        // or wrap the logic.

        // Let's implement: "Save AI Response" if provided in body
        if (body.aiResponse) {
            await prisma.aiChatMessage.create({
                data: {
                    sessionId: currentSessionId,
                    role: "assistant",
                    content: body.aiResponse.content,
                    intent: body.aiResponse.intent,
                    meta: body.aiResponse.meta || {}
                }
            });
        }

        return Response.json({ sessionId: currentSessionId });

    } catch (error) {
        console.error("Chat Error", error);
        return Response.json({ error: "Failed to save chat" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const campaignId = searchParams.get("campaignId");

    try {
        if (sessionId) {
            // Get Specific Session history
            const messages = await prisma.aiChatMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' }
            });
            return Response.json(messages);
        }

        if (campaignId) {
            // List Sessions for Campaign
            const sessions = await prisma.aiChatSession.findMany({
                where: { campaignId },
                orderBy: { updatedAt: 'desc' },
                take: 20
            });
            return Response.json(sessions);
        }

        return Response.json([]);
    } catch (error) {
        return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
    }
}
