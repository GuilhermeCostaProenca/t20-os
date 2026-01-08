import { prisma } from "@/lib/prisma";
import { SessionUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parametro id obrigatorio.";
  return Response.json({ error: message, message }, { status: 400 });
}

export async function PUT(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = SessionUpdateSchema.parse(payload);

    const existing = await prisma.session.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      const message = "Sessao nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        coverUrl: parsed.coverUrl ?? null,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
        status: parsed.status ?? "planned",
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("PUT /api/sessions/[id]", error);
    const message = "Nao foi possivel atualizar a sessao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const existing = await prisma.session.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      const message = "Sessao nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    await prisma.session.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    console.error("DELETE /api/sessions/[id]", error);
    const message = "Nao foi possivel remover a sessao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
