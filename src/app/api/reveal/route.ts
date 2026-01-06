import { prisma } from "@/lib/prisma";
import { RevealCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("roomCode");
    if (!roomCode) {
      return Response.json({ error: "roomCode é obrigatório" }, { status: 400 });
    }

    const now = new Date();
    const reveal = await prisma.reveal.findFirst({
      where: {
        roomCode,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: reveal ?? null });
  } catch (error) {
    console.error("GET /api/reveal", error);
    return Response.json(
      { error: "Não foi possível recuperar o reveal." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = RevealCreateSchema.parse(payload);

    const reveal = await prisma.reveal.create({
      data: {
        roomCode: parsed.roomCode,
        type: parsed.type,
        title: parsed.title,
        content: parsed.content ? { text: parsed.content } : {},
        imageUrl: parsed.imageUrl,
        visibility: parsed.visibility ?? "players",
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      },
    });

    return Response.json({ data: reveal }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/reveal", error);
    return Response.json(
      { error: "Não foi possível criar o reveal." },
      { status: 500 }
    );
  }
}
