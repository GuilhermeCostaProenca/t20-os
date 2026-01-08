import { prisma } from "@/lib/prisma";
import { WorldUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const world = await prisma.world.findUnique({
      where: { id },
      include: {
        campaigns: {
          select: { id: true, name: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!world) {
      const message = "Mundo nao encontrado.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    return Response.json({ data: world });
  } catch (error) {
    console.error("GET /api/worlds/[id]", error);
    const message = "Nao foi possivel carregar o mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const payload = await req.json();
    const parsed = WorldUpdateSchema.parse(payload);

    const updated = await prisma.world.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description,
        coverImage: parsed.coverImage,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }

    console.error("PUT /api/worlds/[id]", error);
    const message = "Nao foi possivel atualizar o mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await prisma.world.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/worlds/[id]", error);
    const message = "Nao foi possivel remover o mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
