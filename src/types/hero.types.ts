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
}
