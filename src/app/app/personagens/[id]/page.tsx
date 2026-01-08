import { CharacterSheetView } from "@/components/character/character-sheet-view";
import { prisma } from "@/lib/prisma";
import { getRuleset } from "@/rulesets";
import { notFound } from "next/navigation";

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getData(id: string) {
  const character = await prisma.character.findUnique({
    where: { id },
    include: { campaign: { select: { rulesetId: true } } },
  });
  if (!character) return null;

  const ruleset = getRuleset(character.campaign?.rulesetId);

  const defaults = {
    characterId: id,
    sheetRulesetId: ruleset.id,
    level: character.level ?? 1,
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
    where: { characterId: id },
    update: {},
    create: validatedDefaults,
  });

  const validatedExisting = ruleset.validateSheet ? ruleset.validateSheet(sheet) : sheet;
  const hasChanges = validatedExisting && JSON.stringify(validatedExisting) !== JSON.stringify(sheet);
  const dataToUpdate = (() => {
    if (!validatedExisting) return {};
    const clone = { ...(validatedExisting as any) };
    delete clone.id;
    delete clone.characterId;
    delete clone.createdAt;
    delete clone.updatedAt;
    return clone;
  })();
  const finalSheet =
    hasChanges && validatedExisting
      ? await prisma.characterSheet.update({ where: { characterId: id }, data: dataToUpdate })
      : validatedExisting;

  return { character, sheet: finalSheet };
}

export default async function CharacterSheetPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  if (!resolvedParams?.id) return notFound();
  const data = await getData(resolvedParams.id);
  if (!data) return notFound();
  const { character, sheet } = data;

  return (
    <div className="space-y-6">
      <CharacterSheetView
        character={{ id: character.id, name: character.name, role: character.role, level: character.level }}
        initialSheet={sheet}
        rulesetId={character.campaign?.rulesetId ?? "tormenta20"}
      />
    </div>
  );
}
