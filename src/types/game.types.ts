import { Card } from './card.types';
import { Hero } from './hero.types';

// Game phases (round-level)
export type GamePhase = 'mulligan' | 'draw' | 'main' | 'combat' | 'round_end' | 'end';

// Turn phases (within a single turn — finer granularity)
export type TurnPhase = 'start_of_turn' | 'main' | 'combat' | 'end_of_turn';

export type PlayerType = 'player' | 'ai';

// Board structure (Single Zone)
export type BoardState = Card[];

// Player state
export interface PlayerState {
    id: string;
    type: PlayerType;
    health: number;
    mana: number;
    maxMana: number;
    deck: Card[];
    hand: Card[];
    board: BoardState;
    graveyard: Card[];
    hero: Hero;
    hasPassed: boolean;
}

// Round information
export interface RoundInfo {
    number: number;
    playerScore: number;
    aiScore: number;
}

// Game state
export interface GameState {
    currentRound: number;
    roundsWon: {
        player: number;
        ai: number;
    };
    currentTurn: PlayerType;
    phase: GamePhase;
    turnPhase?: TurnPhase;
    player: PlayerState;
    ai: PlayerState;
    weather: {
        melee: boolean;
        ranged: boolean;
        siege: boolean;
    };
    roundHistory: RoundInfo[];
    gameOver: boolean;
    winner?: PlayerType | 'draw';
    attackingCardId?: string | null;
}

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';
