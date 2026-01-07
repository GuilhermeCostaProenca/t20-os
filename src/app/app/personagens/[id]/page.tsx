import { prisma } from "@/lib/prisma";
import { CharacterSheetView } from "@/components/character/character-sheet-view";
import { notFound } from "next/navigation";

type PageProps = {
  params: { id: string };
};

async function getData(id: string) {
  const character = await prisma.character.findUnique({
    where: { id },
    include: { campaign: { select: { rulesetId: true } } },
  });
  if (!character) return null;

  const sheet = await prisma.characterSheet.upsert({
    where: { characterId: id },
    update: {},
    create: {
      characterId: id,
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
    },
  });

  return { character, sheet };
}

export default async function CharacterSheetPage({ params }: PageProps) {
  const data = await getData(params.id);
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
