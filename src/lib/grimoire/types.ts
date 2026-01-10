
export type AttributeKey = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';

export interface AttributeModifiers {
    for?: number;
    des?: number;
    con?: number;
    int?: number;
    sab?: number;
    car?: number;
}

export interface RaceAbility {
    name: string;
    description: string;
}

export interface Race {
    id: string;
    name: string;
    attributes: AttributeModifiers; // Fixed modifiers
    attributeSelectable?: number; // Count of flexible attributes (e.g. Humans pick 3)
    abilities: RaceAbility[];
    size: 'small' | 'medium' | 'large';
    displacement: number; // Speed in meters (e.g. 9m)
}
