export interface HeroAbility {
    id: string;
    name: string;
    description: string;
    cooldown: number;
    currentCooldown: number;
    manaCost?: number;
}

export interface Hero {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    ability: HeroAbility;
    artwork: string;
    className: string; // e.g., "Warrior", "Mage", "Ranger"
}
