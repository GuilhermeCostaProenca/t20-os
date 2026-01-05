import { prisma } from "@/lib/prisma";
import { CharacterCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type RouteContext = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!campaign) {
      return Response.json(
        { error: "Campanha não encontrada." },
        { status: 404 }
      );
    }

    const characters = await prisma.character.findMany({
      where: { campaignId: params.id },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ data: characters });
  } catch (error) {
    console.error(`GET /api/campaigns/${params.id}/characters`, error);
    return Response.json(
      { error: "Não foi possível listar personagens." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const payload = await req.json();
    const parsed = CharacterCreateSchema.parse(payload);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!campaign) {
      return Response.json(
        { error: "Campanha não encontrada." },
        { status: 404 }
      );
    }

    const character = await prisma.character.create({
      data: {
        name: parsed.name,
        role: parsed.role,
        level: parsed.level,
        campaignId: params.id,
      },
    });

    return Response.json({ data: character }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error(`POST /api/campaigns/${params.id}/characters`, error);
    return Response.json(
      { error: "Não foi possível criar o personagem." },
      { status: 500 }
    );
  }
}
