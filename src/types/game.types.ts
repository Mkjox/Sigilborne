import { Card } from './card.types';
import { Hero } from './hero.types';

// Game phases
export type GamePhase = 'draw' | 'main' | 'combat' | 'end';
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
    player: PlayerState;
    ai: PlayerState;
    roundHistory: RoundInfo[];
    gameOver: boolean;
    winner?: PlayerType | 'draw';
    attackingCardId?: string | null;
}

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';
