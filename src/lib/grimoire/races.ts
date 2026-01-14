
import { Race } from "./types";

export const RACES: Record<string, Race> = {
    humano: {
        id: 'humano',
        name: 'Humano',
        attributes: {}, // +2 em três diferentes (selecionável)
        attributeSelectable: 3,
        abilities: [
            { name: "Versátil", description: "Você se torna treinado em duas perícias a sua escolha (não precisam ser da sua classe). Você pode trocar uma dessas perícias por um poder geral a sua escolha." }
        ],
        size: 'medium',
        displacement: 9
    },
    anao: {
        id: 'anao',
        name: 'Anão',
        attributes: { con: 4, sab: 2, des: -2 },
        abilities: [
            { name: "Conhecimento das Rochas", description: "Você recebe +2 em Testes de Percepção e Sobrevivência realizados no subterrâneo." },
            { name: "Lento e Pesado", description: "Seu deslocamento é 6m (em vez de 9m). Porém, seu deslocamento não é reduzido por usar armadura pesada ou sobrecarga." },
            { name: "Duro como Pedra", description: "Você recebe +3 pontos de vida no 1º nível e +1 por nível seguinte." },
            { name: "Tradição de Heredrimm", description: "Você é perito em armas tradicionais anãs (machado de batalha, marreta, machado de guerra...)." }
        ],
        size: 'medium',
        displacement: 6
    },
    elfo: {
        id: 'elfo',
        name: 'Elfo',
        attributes: { int: 4, des: 2, con: -2 },
        abilities: [
            { name: "Graça de Glórienn", description: "Seu deslocamento é 12m (em vez de 9m)." },
            { name: "Sangue Mágico", description: "Você recebe +1 ponto de mana por nível." },
            { name: "Sentidos Élficos", description: "Você recebe +2 em Misticismo e Percepção." }
        ],
        size: 'medium',
        displacement: 12
    },
    dahllan: {
        id: 'dahllan',
        name: 'Dahllan',
        attributes: { sab: 4, des: 2, int: -2 },
        abilities: [
            { name: "Amiga das Plantas", description: "Você pode lançar a magia Controlar Plantas (atributo-chave Sabedoria). Caso aprenda novamente, seu custo diminui em -1 PM." },
            { name: "Armadura de Allihanna", description: "Você pode gastar uma ação de movimento e 1 PM para transformar sua pele em casca de árvore (+2 Defesa) até o fim da cena." },
            { name: "Empatia Selvagem", description: "Você pode se comunicar com animais (infomações básicas)." }
        ],
        size: 'medium',
        displacement: 9
    }
};

export const getRace = (id: string): Race | undefined => {
    return RACES[id.toLowerCase()];
};

export const getAllRaces = (): Race[] => {
    return Object.values(RACES).sort((a, b) => a.name.localeCompare(b.name));
};
