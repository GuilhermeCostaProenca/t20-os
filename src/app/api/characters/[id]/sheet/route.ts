import { prisma } from "@/lib/prisma";
import { CharacterSheetUpdateSchema } from "@/lib/validators";
import { getRuleset } from "@/rulesets";
import { ZodError } from "zod";

type Context = { params: { id: string } | Promise<{ id: string }> };

function missingId() {
  const message = "Parâmetro id obrigatório.";
  return Response.json({ error: message, message }, { status: 400 });
}

function stripNonUpdatable(sheet: any) {
  if (!sheet) return {};
  const clone = { ...sheet };
  delete clone.id;
  delete clone.characterId;
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone;
}

async function upsertDefault(characterId: string, rulesetId: string) {
  const ruleset = getRuleset(rulesetId);
  const defaults = {
    characterId,
    sheetRulesetId: ruleset.id,
    level: 1,
    className: null as string | null,
    ancestry: null as string | null,
    deity: null as string | null,
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
  };
  const validatedDefaults = ruleset.validateSheet ? ruleset.validateSheet(defaults) : defaults;
  const sheet = await prisma.characterSheet.upsert({
    where: { characterId },
    update: {},
    create: validatedDefaults,
  });
  const validatedExisting = ruleset.validateSheet ? ruleset.validateSheet(sheet) : sheet;
  const hasChanges = validatedExisting && JSON.stringify(validatedExisting) !== JSON.stringify(sheet);
  if (hasChanges) {
    const updated = await prisma.characterSheet.update({
      where: { characterId },
      data: stripNonUpdatable(validatedExisting),
    });
    return updated;
  }
  return validatedExisting;
}

export async function GET(_req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const character = await prisma.character.findUnique({
      where: { id },
      include: { campaign: { select: { rulesetId: true } } },
    });
    const rulesetId = character?.campaign?.rulesetId ?? "tormenta20";
    const sheet = await upsertDefault(id, rulesetId);
    return Response.json({ data: sheet });
  } catch (error) {
    console.error("GET /api/characters/[id]/sheet", error);
    const message = "Não foi possível carregar a ficha.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Context) {
  let id = "";
  try {
    ({ id } = await Promise.resolve(params));
    if (!id) return missingId();
    const payload = await req.json();
    const parsed = CharacterSheetUpdateSchema.parse(payload);

    const character = await prisma.character.findUnique({
      where: { id },
      include: { campaign: { select: { rulesetId: true } } },
    });
    const rulesetId = parsed.sheetRulesetId ?? character?.campaign?.rulesetId ?? "tormenta20";
    const ruleset = getRuleset(rulesetId);
    const sheetData = { ...parsed, sheetRulesetId: ruleset.id };
    const validated = ruleset.validateSheet ? ruleset.validateSheet(sheetData) : sheetData;

    const sheet = await prisma.characterSheet.upsert({
      where: { characterId: id },
      update: validated,
      create: { characterId: id, ...validated },
    });

    return Response.json({ data: sheet });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join(", ");
      return Response.json({ error: message, message }, { status: 400 });
    }
    console.error("PUT /api/characters/[id]/sheet", error);
    const message = "Não foi possível atualizar a ficha.";
    return Response.json({ error: message, message }, { status: 500 });
  }
}
