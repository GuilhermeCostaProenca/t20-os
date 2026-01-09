import { prisma } from "@/lib/prisma";
import { WorldUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function GET(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
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

export async function PUT(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
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

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();

    // SAFE DELETE: Soft delete only.
    // We do NOT delete the world to preserve the Event Ledger.
    await prisma.world.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/worlds/[id]", error);
    const message = "Nao foi possivel arquivar o mundo.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
