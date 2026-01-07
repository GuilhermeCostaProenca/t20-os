import { z } from "zod";

export const CampaignCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa de pelo menos 2 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "Descricao pode ter ate 500 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  rulesetId: z.string().trim().default("tormenta20").optional(),
});

export const CharacterCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa de pelo menos 2 caracteres"),
  role: z
    .string()
    .trim()
    .max(120, "Funcao curta, por favor")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  level: z
    .coerce.number()
    .int("Nivel deve ser um numero inteiro")
    .min(1, "Nivel minimo e 1")
    .max(20, "Nivel maximo e 20"),
});

export const RevealCreateSchema = z.object({
  roomCode: z.string().trim().min(4).max(12),
  type: z.enum(["npc", "item", "image", "note"]),
  title: z.string().trim().min(1).max(180),
  content: z
    .string()
    .trim()
    .max(1000, "Conteudo muito longo")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  imageUrl: z
    .string()
    .trim()
    .url("URL invalida")
    .max(500, "URL muito longa")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  visibility: z.enum(["players", "master"]).default("players").optional(),
  expiresAt: z.string().datetime().optional(),
});

export const RevealAckSchema = z.object({
  id: z.string().trim().min(1),
  roomCode: z.string().trim().min(4).max(12).optional(),
});

export const CharacterSheetUpdateSchema = z.object({
  sheetRulesetId: z.string().trim().optional(),
  level: z.number().int().min(1).max(20).optional(),
  className: z.string().trim().max(120).optional(),
  ancestry: z.string().trim().max(120).optional(),
  deity: z.string().trim().max(120).optional(),
  for: z.number().int().min(1).max(30).optional(),
  des: z.number().int().min(1).max(30).optional(),
  con: z.number().int().min(1).max(30).optional(),
  int: z.number().int().min(1).max(30).optional(),
  sab: z.number().int().min(1).max(30).optional(),
  car: z.number().int().min(1).max(30).optional(),
  pvCurrent: z.number().int().min(0).optional(),
  pvMax: z.number().int().min(0).optional(),
  pmCurrent: z.number().int().min(0).optional(),
  pmMax: z.number().int().min(0).optional(),
  defenseFinal: z.number().int().min(0).optional(),
  defenseRef: z.number().int().min(0).optional(),
  defenseFort: z.number().int().min(0).optional(),
  defenseWill: z.number().int().min(0).optional(),
  attackBonus: z.number().int().optional(),
  damageFormula: z.string().trim().max(50).optional(),
  critRange: z.number().int().min(1).max(20).optional(),
  critMultiplier: z.number().int().min(1).max(4).optional(),
  skills: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1),
        ability: z.string().trim().max(20).optional(),
        trained: z.boolean().optional(),
        ranks: z.number().int().optional(),
        bonus: z.number().int().optional(),
        misc: z.number().int().optional(),
      })
    )
    .optional(),
  attacks: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1),
        ability: z.string().trim().max(20).optional(),
        bonus: z.number().int().optional(),
        damage: z.string().trim().max(50).optional(),
        critRange: z.number().int().min(1).max(20).optional(),
        critMultiplier: z.number().int().min(1).max(4).optional(),
        type: z.string().trim().max(50).optional(),
      })
    )
    .optional(),
  spells: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1),
        circle: z.string().trim().max(50).optional(),
        cost: z.union([z.string(), z.number()]).optional(),
        description: z.string().trim().max(2000).optional(),
      })
    )
    .optional(),
  notes: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
});

export const CombatStartSchema = z.object({
  campaignId: z.string().trim(),
});

export const CombatInitiativeSchema = z.object({
  combatants: z.array(
    z.object({
      id: z.string().trim().optional(),
      name: z.string().trim(),
      refId: z.string().trim(),
      kind: z.enum(["CHARACTER", "NPC", "MONSTER"]),
      des: z.number().int().optional().default(10),
      hpCurrent: z.number().int().min(0).optional(),
      hpMax: z.number().int().min(0).optional(),
      mpCurrent: z.number().int().min(0).optional(),
      mpMax: z.number().int().min(0).optional(),
    })
  ),
});

export const CombatTurnSchema = z.object({
  direction: z.enum(["next", "prev"]).default("next"),
});

export const CombatActionSchema = z.object({
  actorId: z.string().trim(),
  actorName: z.string().trim(),
  kind: z.enum(["ATTACK", "SPELL", "SKILL"]),
  targetId: z.string().trim(),
  toHitMod: z.number().int().optional(),
  damageFormula: z.string().trim().max(50).optional(),
  useSheet: z.boolean().optional(),
  attackId: z.string().trim().optional(),
  spellId: z.string().trim().optional(),
  skillId: z.string().trim().optional(),
  costMp: z.number().int().optional(),
  visibility: z.enum(["MASTER", "PLAYERS"]).default("MASTER"),
});

export const CombatApplySchema = z.object({
  targetId: z.string().trim(),
  deltaHp: z.number().int().optional(),
  deltaMp: z.number().int().optional(),
  visibility: z.enum(["MASTER", "PLAYERS"]).default("MASTER"),
  note: z.string().trim().max(200).optional(),
});

export const CombatAttackFromSheetSchema = z.object({
  combatId: z.string().trim(),
  attackerCombatantId: z.string().trim(),
  targetCombatantId: z.string().trim(),
  attackId: z.string().trim().optional(),
});

export const ActionRequestCreateSchema = z.object({
  campaignId: z.string().trim(),
  combatId: z.string().trim().optional(),
  roomCode: z.string().trim().optional(),
  actorId: z.string().trim(),
  targetId: z.string().trim(),
  type: z.enum(["ATTACK", "SPELL", "SKILL"]),
  payload: z.any().optional(),
});

export const ActionRequestApplySchema = z.object({
  action: z.enum(["apply", "reject"]).default("apply"),
});
