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
      return Response.json({ error: "Reveal não encontrado." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("POST /api/reveal/ack", error);
    return Response.json(
      { error: "Não foi possível confirmar o reveal." },
      { status: 500 }
    );
  }
}
