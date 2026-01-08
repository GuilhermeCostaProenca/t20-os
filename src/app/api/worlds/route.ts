import { prisma } from "@/lib/prisma";
import { WorldCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET() {
  try {
    const worlds = await prisma.world.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: worlds });
  } catch (error) {
    console.error("GET /api/worlds", error);
    const message = "Nao foi possivel listar mundos.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = WorldCreateSchema.parse(payload);

    const world = await prisma.world.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        coverImage: parsed.coverImage,
      },
    });

    return Response.json({ data: world }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }

    console.error("POST /api/worlds", error);
    const message = "Nao foi possivel criar o mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
