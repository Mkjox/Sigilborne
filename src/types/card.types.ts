export type CardType = 'unit' | 'spell' | 'weather';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
// RowType removed
export type AbilityTrigger = 'onPlay' | 'onDeath' | 'passive' | 'activate';

// ─── Factions ───────────────────────────────────────────────────
export type Faction = 'order' | 'shadow' | 'nature' | 'arcane' | 'neutral';

// ─── Composable Ability Effect Graph ────────────────────────────
/**
 * TargetSelector describes WHO is affected by an ability.
 * New abilities only need a new selector entry — no engine code changes.
 */
export type TargetSelector =
    | { type: 'self' }
    | { type: 'adjacent' }
    | { type: 'all_allies' }
    | { type: 'all_enemies' }
    | { type: 'strongest_enemy' }
    | { type: 'weakest_enemy' }
    | { type: 'random_enemy' }
    | { type: 'random_ally' }
    | { type: 'all_units' }; // Both boards

/**
 * OperationType describes WHAT happens to the targets.
 */
export type OperationType =
    | { type: 'boost'; value: number }
    | { type: 'damage'; value: number }
    | { type: 'destroy' }
    | { type: 'revive' }
    | { type: 'draw'; value: number }
    | { type: 'heal'; value: number }
    | { type: 'multiply'; value: number };

/**
 * EffectGraph combines trigger + target + operation into a single
 * declarative structure. The engine resolves these generically.
 */
export interface EffectGraph {
    trigger: AbilityTrigger;
    target: TargetSelector;
    operation: OperationType;
}

export interface Ability {
    id: string;
    name: string;
    type: string;
    trigger: AbilityTrigger;
    value?: number;
    description: string;
    effect?: (context: any) => void;
    /** New composable format — engine prefers this over legacy `type` string */
    effectGraph?: EffectGraph;
}

export interface Card {
    id: string;
    name: string;
    type: CardType;
    rarity: CardRarity;
    faction?: Faction;
    manaCost: number;
    power: number; // Current Health / Score Contribution
    basePower?: number; // Original/Max Health
    attack: number; // Damage dealt
    isExhausted?: boolean; // Cannot attack this turn
    category?: 'melee' | 'ranged' | 'siege'; // Added back to track weather targets
    // row removed
    abilities: Ability[];
    artwork: any;
    description: string;
    flavorText?: string;
    isHero?: boolean;
}
