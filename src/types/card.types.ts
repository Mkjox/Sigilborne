// Card-related types
export type CardType = 'unit' | 'spell' | 'weather';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RowType = 'melee' | 'ranged' | 'siege';
export type AbilityTrigger = 'onPlay' | 'onDeath' | 'passive' | 'activate';

export interface Ability {
    id: string;
    name: string;
    type: string;
    trigger: AbilityTrigger;
    value?: number;
    description: string;
    effect?: (context: any) => void; // Will be properly typed in Phase 4
}

export interface Card {
    id: string;
    name: string;
    type: CardType;
    rarity: CardRarity;
    manaCost: number;
    power?: number; // For unit cards
    row?: RowType; // For unit cards
    abilities: Ability[];
    artwork: any;
    description: string;
    flavorText?: string;
}
