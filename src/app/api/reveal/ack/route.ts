import { prisma } from "@/lib/prisma";
import { RevealAckSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = RevealAckSchema.parse(payload);

    const updated = await prisma.reveal.updateMany({
      where: {
        id: parsed.id,
        ...(parsed.roomCode ? { roomCode: parsed.roomCode } : {}),
      },
      data: { expiresAt: new Date() },
    });

    if (updated.count === 0) {
      const message = "Reveal nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("POST /api/reveal/ack", error);
    const message = "Nao foi possivel confirmar o reveal.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}