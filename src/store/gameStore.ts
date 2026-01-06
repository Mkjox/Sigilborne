import { create } from 'zustand';
import { GameState, PlayerType } from '../types';

// Placeholder game store (will be fully implemented in Phase 2)
interface GameStore extends GameState {
    // Actions (to be implemented in Phase 2)
    startGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
    endTurn: () => void;
    playCard: (cardId: string, row?: string) => void;
    passTurn: () => void;
    resetGame: () => void;
}

// Initial state helper
const createInitialState = (): GameState => ({
    currentRound: 1,
    roundsWon: { player: 0, ai: 0 },
    currentTurn: 'player' as PlayerType,
    phase: 'draw',
    player: {
        id: 'player',
        type: 'player' as PlayerType,
        health: 30,
        mana: 1,
        maxMana: 1,
        deck: [],
        hand: [],
        board: { melee: [], ranged: [], siege: [] },
        graveyard: [],
        hero: {
            id: 'hero1',
            name: 'Placeholder Hero',
            health: 30,
            maxHealth: 30,
            ability: {
                id: 'ability1',
                name: 'Placeholder',
                description: 'To be implemented',
                cooldown: 3,
                currentCooldown: 0,
            },
            artwork: '',
            className: 'Warrior',
        },
        hasPassed: false,
    },
    ai: {
        id: 'ai',
        type: 'ai' as PlayerType,
        health: 30,
        mana: 1,
        maxMana: 1,
        deck: [],
        hand: [],
        board: { melee: [], ranged: [], siege: [] },
        graveyard: [],
        hero: {
            id: 'hero2',
            name: 'AI Hero',
            health: 30,
            maxHealth: 30,
            ability: {
                id: 'ability2',
                name: 'Placeholder',
                description: 'To be implemented',
                cooldown: 3,
                currentCooldown: 0,
            },
            artwork: '',
            className: 'Mage',
        },
        hasPassed: false,
    },
    roundHistory: [],
    gameOver: false,
});

export const useGameStore = create<GameStore>((set) => ({
    ...createInitialState(),

    // Placeholder actions (will be implemented in Phase 2)
    startGame: (difficulty) => {
        console.log('Starting game with difficulty:', difficulty);
        set(createInitialState());
    },

    endTurn: () => {
        console.log('Ending turn');
    },

    playCard: (cardId, row) => {
        console.log('Playing card:', cardId, 'to row:', row);
    },

    passTurn: () => {
        set((state) => ({
            player: { ...state.player, hasPassed: true },
        }));
    },

    resetGame: () => {
        set(createInitialState());
    },
}));
