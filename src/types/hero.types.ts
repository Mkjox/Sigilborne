import { Ability, Faction } from './card.types';

export interface HeroAbility extends Ability {
    cooldown: number;
    currentCooldown: number;
    manaCost?: number;
}

export interface Hero {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    faction: Faction;
    ability: HeroAbility;
    artwork: any;
    className: string; // e.g., "Warrior", "Mage", "Ranger"
    flavorText?: string;
}

// ─── Talent System ───────────────────────────────────────────────

export type TalentEffect = 
    | { type: 'stat_boost'; target: 'hero_health' | 'starting_mana' | 'hero_power_cooldown'; value: number }
    | { type: 'passive_ability'; abilityId: string }
    | { type: 'faction_bonus'; faction: Faction; attackBoost: number };

export interface Talent {
    id: string;
    name: string;
    description: string;
    icon: string;
    effect: TalentEffect;
    requirements?: string[]; // IDs of prerequisite talents
    position: { x: number; y: number }; // For visual tree layout
}

export interface TalentTree {
    heroId: string;
    talents: Talent[];
}
