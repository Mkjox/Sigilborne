import { Card } from './card.types';
import { Hero } from './hero.types';

// Game phases
export type GamePhase = 'draw' | 'main' | 'combat' | 'end';
export type PlayerType = 'player' | 'ai';

// Board structure (3 rows)
export interface BoardRow {
    melee: Card[];
    ranged: Card[];
    siege: Card[];
}

// Player state
export interface PlayerState {
    id: string;
    type: PlayerType;
    health: number;
    mana: number;
    maxMana: number;
    deck: Card[];
    hand: Card[];
    board: BoardRow;
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
    player: PlayerState;
    ai: PlayerState;
    roundHistory: RoundInfo[];
    gameOver: boolean;
    winner?: PlayerType;
}

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';
