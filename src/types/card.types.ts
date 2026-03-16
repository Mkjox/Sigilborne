export type CardType = 'unit' | 'spell' | 'weather';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
// RowType removed
export type AbilityTrigger = 'onPlay' | 'onDeath' | 'passive' | 'activate';

export interface Ability {
    id: string;
    name: string;
    type: string;
    trigger: AbilityTrigger;
    value?: number;
    description: string;
    effect?: (context: any) => void;
}

export interface Card {
    id: string;
    name: string;
    type: CardType;
    rarity: CardRarity;
    manaCost: number;
    power: number; // Current Health / Score Contribution
    basePower?: number; // Original/Max Health
    attack: number; // Damage dealt
    isExhausted?: boolean; // Cannot attack this turn
    // row removed
    abilities: Ability[];
    artwork: any;
    description: string;
    flavorText?: string;
    isHero?: boolean;
}
