import { useGameStore } from '../gameStore';
import { Difficulty } from '../../types';

// Mock the campaign store to avoid persisting data or side effects
jest.mock('../campaignStore', () => ({
    useCampaignStore: {
        getState: () => ({
            unlockedTalentIds: [],
            relics: []
        })
    }
}));

// Mock deck store
jest.mock('../deckStore', () => ({
    useDeckStore: {
        getState: () => ({
            getActiveDeck: () => null
        })
    }
}));

describe('Game Store', () => {
    beforeEach(() => {
        // Reset the store before each test
        const store = useGameStore.getState();
        store.resetGame();
    });

    test('startGame should initialize state correctly', () => {
        const store = useGameStore.getState();
        store.startGame('medium' as Difficulty);

        const state = useGameStore.getState();
        expect(state.phase).toBe('mulligan');
        expect(state.player.hand.length).toBeGreaterThan(0);
        expect(state.difficulty).toBe('medium');
    });

    test('passTurn should switch turns and update status', () => {
        const store = useGameStore.getState();
        store.startGame('medium' as Difficulty);
        
        // Initial turn should be player
        expect(useGameStore.getState().currentTurn).toBe('player');
        
        store.passTurn();
        
        const state = useGameStore.getState();
        expect(state.player.hasPassed).toBe(true);
        // It should switch to AI
        expect(state.currentTurn).toBe('ai');
    });
});
