import { create } from 'zustand';
import { GameState, PlayerType, Difficulty, RowType } from '../types';
import {
    createInitialGameState,
    playCard as enginePlayCard,
    passTurn as enginePassTurn,
    endTurn as engineEndTurn,
    shouldEndRound,
    resolveRound,
    startNextRound,
    getTotalPower,
    WeatherState,
    useHeroAbility as engineUseHeroAbility,
} from '../engine';
import { makeAIDecision, getAIDelay } from '../engine/aiEngine';
import { useDeckStore } from './deckStore';
import { createStarterDeck } from '../data/cardData';

interface GameStore extends GameState {
    // Game settings
    difficulty: Difficulty;
    weather: WeatherState;
    isAIThinking: boolean;
    selectedCardId: string | null;
    message: string | null;

    // Actions
    startGame: (difficulty: Difficulty) => void;
    playCard: (cardId: string, targetRow?: RowType) => void;
    useHeroAbility: () => void;
    passTurn: () => void;
    endTurn: () => void;
    resetGame: () => void;
    selectCard: (cardId: string | null) => void;
    setMessage: (message: string | null) => void;

    // Computed
    getPlayerPower: () => number;
    getAIPower: () => number;
}

// Initial placeholder state
const createEmptyState = (): GameState => ({
    currentRound: 1,
    roundsWon: { player: 0, ai: 0 },
    currentTurn: 'player' as PlayerType,
    phase: 'draw',
    player: {
        id: 'player',
        type: 'player' as PlayerType,
        health: 2,
        mana: 10,
        maxMana: 10,
        deck: [],
        hand: [],
        board: { melee: [], ranged: [], siege: [] },
        graveyard: [],
        hero: {
            id: 'hero1',
            name: 'Commander',
            health: 2,
            maxHealth: 2,
            ability: {
                id: 'ability1',
                name: 'Rally',
                type: 'boost_all',
                trigger: 'activate',
                description: 'Boost all units by 1',
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
        health: 2,
        mana: 10,
        maxMana: 10,
        deck: [],
        hand: [],
        board: { melee: [], ranged: [], siege: [] },
        graveyard: [],
        hero: {
            id: 'hero2',
            name: 'Dark Lord',
            health: 2,
            maxHealth: 2,
            ability: {
                id: 'ability2',
                name: 'Dark Command',
                type: 'damage_strongest',
                trigger: 'activate',
                description: 'Deal 2 damage to a unit',
                cooldown: 3,
                currentCooldown: 0,
            },
            artwork: '',
            className: 'Warlock',
        },
        hasPassed: false,
    },
    roundHistory: [],
    gameOver: false,
});

export const useGameStore = create<GameStore>((set, get) => ({
    ...createEmptyState(),
    difficulty: 'medium',
    weather: { melee: false, ranged: false, siege: false },
    isAIThinking: false,
    selectedCardId: null,
    message: null,

    startGame: (difficulty) => {
        // Check for custom deck
        const activeDeck = useDeckStore.getState().getActiveDeck();
        const playerDeck = activeDeck && activeDeck.cards.length >= 10
            ? activeDeck.cards.map(c => ({ ...c, id: Math.random().toString(36).substring(2, 11) }))
            : null;

        const initialState = createInitialGameState(difficulty, playerDeck);
        set({
            ...initialState,
            difficulty,
            weather: { melee: false, ranged: false, siege: false },
            isAIThinking: false,
            selectedCardId: null,
            message: activeDeck ? `Playing with ${activeDeck.name}` : 'Game started!',
        });
    },

    playCard: (cardId, targetRow) => {
        const state = get();

        // Can't play if not player's turn or game is over
        if (state.currentTurn !== 'player' || state.gameOver || state.isAIThinking) {
            return;
        }

        // Find the card to determine its row
        const card = state.player.hand.find(c => c.id === cardId);
        if (!card) return;

        const row = card.row || targetRow || 'melee';

        // Play the card using game engine
        const gameState: GameState = {
            currentRound: state.currentRound,
            roundsWon: state.roundsWon,
            currentTurn: state.currentTurn,
            phase: state.phase,
            player: state.player,
            ai: state.ai,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
        };

        const { newState, success, message } = enginePlayCard(
            gameState,
            cardId,
            row,
            state.weather
        );

        if (!success) {
            set({ message: message || 'Cannot play card' });
            return;
        }

        // Handle weather cards
        if (card.type === 'weather') {
            const newWeather = { ...state.weather };
            const ability = card.abilities[0];
            if (ability?.id === 'frost') newWeather.melee = true;
            if (ability?.id === 'fog') newWeather.ranged = true;
            if (ability?.id === 'clear_weather') {
                newWeather.melee = false;
                newWeather.ranged = false;
                newWeather.siege = false;
            }
            set({ weather: newWeather });
        }

        set({
            ...newState,
            selectedCardId: null,
            message: `Played ${card.name}`,
        });
    },

    useHeroAbility: () => {
        const state = get();

        if (state.currentTurn !== 'player' || state.gameOver || state.isAIThinking) {
            return;
        }

        const { newState, success, message } = engineUseHeroAbility(state);

        if (success) {
            set({
                ...newState,
                message: message || 'Used Hero Ability',
            });
        } else {
            set({ message: message || 'Cannot use ability' });
        }
    },

    passTurn: () => {
        const state = get();

        if (state.currentTurn !== 'player' || state.gameOver || state.isAIThinking) {
            return;
        }

        const gameState: GameState = {
            currentRound: state.currentRound,
            roundsWon: state.roundsWon,
            currentTurn: state.currentTurn,
            phase: state.phase,
            player: state.player,
            ai: state.ai,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
        };

        const passedState = enginePassTurn(gameState);

        set({
            ...passedState,
            message: 'You passed',
        });

        // Check if round ends
        if (shouldEndRound(passedState)) {
            const resolvedState = resolveRound(passedState, state.weather);

            if (resolvedState.gameOver) {
                set({
                    ...resolvedState,
                    message: resolvedState.winner === 'player' ? 'Victory!' : 'Defeat!',
                });
            } else {
                // Start next round
                const nextRoundState = startNextRound(resolvedState);
                set({
                    ...nextRoundState,
                    weather: { melee: false, ranged: false, siege: false },
                    message: `Round ${resolvedState.currentRound} complete! Starting round ${nextRoundState.currentRound}`,
                });
            }
        } else {
            // AI's turn
            get().endTurn();
        }
    },

    endTurn: () => {
        const state = get();

        const gameState: GameState = {
            currentRound: state.currentRound,
            roundsWon: state.roundsWon,
            currentTurn: state.currentTurn,
            phase: state.phase,
            player: state.player,
            ai: state.ai,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
        };

        const nextTurnState = engineEndTurn(gameState);

        set({
            ...nextTurnState,
        });

        // If it's now AI's turn, make AI move
        if (nextTurnState.currentTurn === 'ai' && !nextTurnState.ai.hasPassed) {
            set({ isAIThinking: true });

            const delay = getAIDelay(state.difficulty);

            setTimeout(() => {
                const currentState = get();
                const decision = makeAIDecision(
                    {
                        currentRound: currentState.currentRound,
                        roundsWon: currentState.roundsWon,
                        currentTurn: currentState.currentTurn,
                        phase: currentState.phase,
                        player: currentState.player,
                        ai: currentState.ai,
                        roundHistory: currentState.roundHistory,
                        gameOver: currentState.gameOver,
                        winner: currentState.winner,
                    },
                    currentState.difficulty
                );

                if (decision.action === 'pass') {
                    // AI passes
                    const aiGameState: GameState = {
                        currentRound: currentState.currentRound,
                        roundsWon: currentState.roundsWon,
                        currentTurn: 'ai',
                        phase: currentState.phase,
                        player: currentState.player,
                        ai: currentState.ai,
                        roundHistory: currentState.roundHistory,
                        gameOver: currentState.gameOver,
                        winner: currentState.winner,
                    };

                    const aiPassedState = enginePassTurn(aiGameState);
                    // Swap currentTurn back to ai before checking
                    aiPassedState.currentTurn = 'ai';

                    set({
                        ai: { ...aiPassedState.ai, hasPassed: true },
                        isAIThinking: false,
                        message: 'AI passed',
                    });

                    // Check if round ends
                    if (currentState.player.hasPassed) {
                        const resolvedState = resolveRound(
                            { ...aiPassedState, ai: { ...aiPassedState.ai, hasPassed: true } },
                            currentState.weather
                        );

                        if (resolvedState.gameOver) {
                            set({
                                ...resolvedState,
                                isAIThinking: false,
                                message: resolvedState.winner === 'player' ? 'Victory!' : 'Defeat!',
                            });
                        } else {
                            const nextRoundState = startNextRound(resolvedState);
                            set({
                                ...nextRoundState,
                                weather: { melee: false, ranged: false, siege: false },
                                isAIThinking: false,
                                message: `Round complete! Starting round ${nextRoundState.currentRound}`,
                            });
                        }
                    } else {
                        // Player's turn
                        set({ currentTurn: 'player', isAIThinking: false });
                    }
                } else if (decision.cardId && decision.targetRow) {
                    // AI plays a card
                    const aiGameState: GameState = {
                        currentRound: currentState.currentRound,
                        roundsWon: currentState.roundsWon,
                        currentTurn: 'ai',
                        phase: currentState.phase,
                        player: currentState.player,
                        ai: currentState.ai,
                        roundHistory: currentState.roundHistory,
                        gameOver: currentState.gameOver,
                        winner: currentState.winner,
                    };

                    const card = currentState.ai.hand.find(c => c.id === decision.cardId);

                    const { newState } = enginePlayCard(
                        aiGameState,
                        decision.cardId,
                        decision.targetRow,
                        currentState.weather
                    );

                    // Handle weather effects if AI played a weather card
                    let newWeather = { ...currentState.weather };
                    if (card?.type === 'weather') {
                        const ability = card.abilities[0];
                        if (ability?.id === 'frost') newWeather.melee = true;
                        if (ability?.id === 'fog') newWeather.ranged = true;
                        if (ability?.id === 'clear_weather') {
                            newWeather.melee = false;
                            newWeather.ranged = false;
                            newWeather.siege = false;
                        }
                    }

                    set({
                        ai: newState.ai,
                        weather: newWeather,
                        currentTurn: 'player',
                        isAIThinking: false,
                        message: card ? `AI played ${card.name}` : 'AI played a card',
                    });
                } else {
                    // Fallback
                    set({ currentTurn: 'player', isAIThinking: false });
                }
            }, delay);
        }
    },

    resetGame: () => {
        set({
            ...createEmptyState(),
            difficulty: 'medium',
            weather: { melee: false, ranged: false, siege: false },
            isAIThinking: false,
            selectedCardId: null,
            message: null,
        });
    },

    selectCard: (cardId) => {
        set({ selectedCardId: cardId });
    },

    setMessage: (message) => {
        set({ message });
    },

    getPlayerPower: () => {
        const state = get();
        return getTotalPower(state.player.board, state.weather);
    },

    getAIPower: () => {
        const state = get();
        return getTotalPower(state.ai.board, state.weather);
    },
}));
