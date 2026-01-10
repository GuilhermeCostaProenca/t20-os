import { CharacterClass } from "../base/types";

export const GUERREIRO: CharacterClass = {
    id: 'guerreiro',
    name: 'Guerreiro',
    description: 'Mestres do combate armado, capazes de usar qualquer arma ou armadura com perícia inigualável.',
    hp: { base: 20, perLevel: 5 },
    pm: { base: 3, perLevel: 3 },
    proficiencies: ['Armas Marciais', 'Armaduras Pesadas', 'Escudos'],
    // In a full implementation, we would define the initial skills selection logic here
};

export const ARCANISTA: CharacterClass = {
    id: 'arcanista',
    name: 'Arcanista',
    description: 'Estudiosos ou portadores de magia arcana, capazes de alterar a realidade com seus feitiços.',
    hp: { base: 8, perLevel: 2 },
    pm: { base: 6, perLevel: 6 },
    proficiencies: [],
    // Arcanist has Paths (Caminhos): Bruxo, Feiticeiro, Mago. 
    // For MVP, we treat it as a generic Arcanist, but in strict rules we need a "Subclass" or "Path" selection step.
};

export const TORMENTA20_CLASSES: CharacterClass[] = [
    GUERREIRO,
    ARCANISTA
];

export function getClass(id: string): CharacterClass | undefined {
    return TORMENTA20_CLASSES.find(c => c.id === id);
}
