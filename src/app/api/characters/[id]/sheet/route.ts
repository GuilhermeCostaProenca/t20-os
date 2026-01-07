import { prisma } from "@/lib/prisma";
import { CharacterSheetUpdateSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Context = { params: { id: string } };

async function upsertDefault(characterId: string) {
  return prisma.characterSheet.upsert({
    where: { characterId },
    update: {},
    create: {
      characterId,
      level: 1,
      className: null,
      ancestry: null,
      deity: null,
      pvCurrent: 10,
      pvMax: 10,
      pmCurrent: 5,
      pmMax: 5,
      attackBonus: 0,
      damageFormula: "1d6",
      critRange: 20,
      critMultiplier: 2,
      defenseFinal: 10,
      defenseRef: 0,
      defenseFort: 0,
      defenseWill: 0,
      skills: [],
      attacks: [],
      spells: [],
    },
  });
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const sheet = await upsertDefault(params.id);
    return Response.json({ data: sheet });
  } catch (error) {
    console.error("GET /api/characters/[id]/sheet", error);
    return Response.json({ error: "Não foi possível carregar a ficha." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Context) {
  try {
    const payload = await req.json();
    const parsed = CharacterSheetUpdateSchema.parse(payload);

    const sheet = await prisma.characterSheet.upsert({
      where: { characterId: params.id },
      update: parsed,
      create: { characterId: params.id, ...parsed },
    });

    return Response.json({ data: sheet });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("PUT /api/characters/[id]/sheet", error);
    return Response.json({ error: "Não foi possível atualizar a ficha." }, { status: 500 });
  }
}
