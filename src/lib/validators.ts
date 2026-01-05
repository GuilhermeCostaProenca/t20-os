import { z } from "zod";

export const CampaignCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa de pelo menos 2 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "Descrição pode ter até 500 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const CharacterCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa de pelo menos 2 caracteres"),
  role: z
    .string()
    .trim()
    .max(120, "Função curta, por favor")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  level: z
    .coerce.number()
    .int("Nível deve ser um número inteiro")
    .min(1, "Nível mínimo é 1")
    .max(20, "Nível máximo é 20"),
});
