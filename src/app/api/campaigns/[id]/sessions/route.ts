import { prisma } from "@/lib/prisma";
import { SessionCreateSchema } from "@/lib/validators";
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
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const sessions = await prisma.session.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: sessions });
  } catch (error) {
    console.error(`GET /api/campaigns/${id || "unknown"}/sessions`, error);
    const message = "Nao foi possivel listar sessoes.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = SessionCreateSchema.parse(payload);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!campaign) {
      const message = "Campanha nao encontrada.";
      return Response.json({ error: message, message }, { status: 404 });
    }

    const session = await prisma.session.create({
      data: {
        campaignId: id,
        title: parsed.title,
        description: parsed.description,
        coverUrl: parsed.coverUrl,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
        status: parsed.status ?? "planned",
      },
    });

    return Response.json({ data: session }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error(`POST /api/campaigns/${id || "unknown"}/sessions`, error);
    const message = "Nao foi possivel criar a sessao.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
