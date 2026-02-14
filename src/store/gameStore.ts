import { create } from 'zustand';
import { GameState, PlayerType, Difficulty } from '../types';
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
    attackUnit,
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
    playCard: (cardId: string) => void;
    useHeroAbility: () => void;
    passTurn: () => void;
    endTurn: () => void;
    resetGame: () => void;
    selectCard: (cardId: string | null) => void;
    setMessage: (message: string | null) => void;
    triggerAI: () => void;
    setAttackingCard: (cardId: string | null) => void;
    attackCard: (targetId: string) => void;

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
        board: [],
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
        board: [],
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
        // If deck has at least 10 cards, use it. Otherwise uses default starter deck logic in engine
        const playerDeck = activeDeck && activeDeck.cards.length >= 10
            ? activeDeck.cards.map(c => ({ ...c, id: Math.random().toString(36).substring(2, 11) }))
            : null;

        const initialState = createInitialGameState(difficulty, playerDeck || undefined);
        set({
            ...initialState,
            difficulty,
            weather: { melee: false, ranged: false, siege: false },
            isAIThinking: false,
            winner: undefined,
            message: 'Game Started',
        });
    },

    playCard: (cardId: string) => {
        const state = get();

        // Can't play if not player's turn or game is over
        if (state.currentTurn !== 'player' || state.gameOver || state.isAIThinking) {
            return;
        }

        // Find the card
        const card = state.player.hand.find(c => c.id === cardId);
        if (!card) return;

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
            state.weather
        );

        if (!success) {
            set({ message: message || 'Cannot play card' });
            return;
        }

        // Handle weather cards (Simplified/Disabled for now or needs update)
        if (card.type === 'weather') {
            // Weather logic needs refactor for single zone
            // For now, doing nothing or simple clear
            if (card.abilities[0]?.id === 'clear_weather') {
                set({ weather: { melee: false, ranged: false, siege: false } });
            }
        }

        set({
            ...newState,
            selectedCardId: null,
            message: `Played ${card.name}`,
        });

        // End turn after playing
        get().endTurn();
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
            // End turn after ability
            get().endTurn();
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

        const passedState = enginePassTurn(gameState, 'player');

        set({
            ...passedState,
            message: 'You passed',
        });

        if (shouldEndRound(passedState)) {
            const resolvedState = resolveRound(passedState);

            if (resolvedState.gameOver) {
                set({
                    ...resolvedState,
                    message: resolvedState.winner === 'player' ? 'Victory!' : (resolvedState.winner === 'draw' ? 'Draw!' : 'Defeat!'),
                });
            } else {
                // Start next round
                const nextRoundState = startNextRound(resolvedState);
                const lastRound = resolvedState.roundHistory[resolvedState.roundHistory.length - 1];
                const roundWinner = lastRound.playerScore > lastRound.aiScore ? 'You Won' : (lastRound.aiScore > lastRound.playerScore ? 'AI Won' : 'Draw');

                set({
                    ...nextRoundState,
                    weather: { melee: false, ranged: false, siege: false },
                    message: `${roundWinner} Round ${resolvedState.currentRound}!`,
                });

                // Check if AI goes first next round
                if (nextRoundState.currentTurn === 'ai') {
                    get().triggerAI();
                }
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
            attackingCardId: state.attackingCardId,
        };

        const nextTurnState = engineEndTurn(gameState);
        let finalTurnState = nextTurnState;

        // Recursively skip if the next player has turned (passed)
        // Since there are only 2 players, if next passed, switch back.
        // If BOTH passed, shouldEndRound would have caught it in passTurn.
        const nextPlayerId = finalTurnState.currentTurn;
        const nextPlayerHasPassed = nextPlayerId === 'player' ? finalTurnState.player.hasPassed : finalTurnState.ai.hasPassed;

        if (nextPlayerHasPassed) {
            const otherPlayer = nextPlayerId === 'player' ? 'ai' : 'player';
            finalTurnState = {
                ...finalTurnState,
                currentTurn: otherPlayer
            };
            // Also need to refresh if we skipped back? 
            // engineEndTurn handles refresh for the *active* player. 
            // If we skip back, we might need to refresh the "other" player again?
            // Simplified: The engineEndTurn refreshes the *target* of the switch.
        }

        set({
            ...finalTurnState,
            attackingCardId: null, // Clear interaction
        });

        if (finalTurnState.currentTurn === 'ai' && !finalTurnState.ai.hasPassed) {
            get().triggerAI();
        }
    },

    setAttackingCard: (cardId: string | null) => {
        set({ attackingCardId: cardId, selectedCardId: null });
    },

    attackCard: (targetId: string) => {
        const state = get();
        const attackerId = state.attackingCardId;

        if (!attackerId) return;

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
            attackingCardId: state.attackingCardId,
        };

        const { newState, success, message } = attackUnit(gameState, attackerId, targetId);

        if (success) {
            set({
                ...newState,
                attackingCardId: null, // Reset after attack
                message: 'Attack!',
            });
            // Update UI/Sound?
        } else {
            set({ message: message || 'Attack failed', attackingCardId: null });
        }
    },



    triggerAI: () => {
        const state = get();
        if (state.currentTurn === 'ai' && !state.ai.hasPassed) {
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

                    const aiPassedState = enginePassTurn(aiGameState, 'ai');
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
                            { ...aiPassedState, ai: { ...aiPassedState.ai, hasPassed: true } }
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
                                message: `Round ${nextRoundState.currentRound} started`,
                            });

                            // Check if AI goes first next round
                            if (nextRoundState.currentTurn === 'ai') {
                                get().triggerAI();
                            }
                        }
                    } else {
                        // Player's turn
                        set({ currentTurn: 'player', isAIThinking: false });
                    }
                } else if (decision.cardId) {
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
                        currentState.weather
                    );

                    // Handle weather effects if AI played a weather card (Simplified)
                    let newWeather = { ...currentState.weather };
                    if (card?.type === 'weather') {
                        if (card.abilities[0]?.id === 'clear_weather') {
                            newWeather = { melee: false, ranged: false, siege: false };
                        }
                    }

                    set({
                        ai: newState.ai,
                        weather: newWeather,
                        isAIThinking: false,
                        message: card ? `AI played ${card.name}` : 'AI played a card',
                    });

                    // End turn to cycle back to player or keep handling AI if player passed
                    get().endTurn();
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
        return getTotalPower(state.player.board, state.weather, state.ai.board);
    },

    getAIPower: () => {
        const state = get();
        return getTotalPower(state.ai.board, state.weather, state.player.board);
    },
}));
