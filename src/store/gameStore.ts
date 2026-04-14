import { create } from 'zustand';
import { GameState, PlayerType, Difficulty, PlayerState, GamePhase } from '../types';
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
    getGlobalEventBus,
    resetGlobalEventBus,
    resolveEffectGraph,
    AbilityContext,
} from '../engine';
import { makeAIDecision, getAIDelay } from '../engine/aiEngine';
import { useDeckStore } from './deckStore';
import { useCampaignStore } from './campaignStore';
import { createStarterDeck, AVAILABLE_HEROES, getTalentTreeForHero } from '../data/cardData';
import { getRelicById } from '../data/relicData';
import { Card } from '../types';
import i18n from '../i18n';

interface GameStore extends GameState {
    // Game settings
    difficulty: Difficulty;
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
    continueToNextRound: () => void;
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
    phase: 'mulligan',
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
            faction: 'order',
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
            id: 'dummy_hero_ai',
            name: 'Dummy AI',
            health: 2,
            maxHealth: 2,
            ability: {
                id: 'dummy_ability_ai',
                name: 'Dummy',
                type: 'damage_strongest',
                trigger: 'activate',
                description: 'Dummy',
                cooldown: 0,
                currentCooldown: 0,
            },
            artwork: require('../../assets/heroes/hero_darklord.jpg'),
            className: 'Dummy',
            faction: 'shadow'
        },
        hasPassed: false,
    },
    weather: { melee: false, ranged: false, siege: false },
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
    currentVFX: 'none',

    startGame: (difficulty) => {
        // Check for custom deck
        const activeDeck = useDeckStore.getState().getActiveDeck();
        // If deck has at least 10 cards, use it. Otherwise uses default starter deck logic in engine
        const playerDeck = activeDeck && activeDeck.cards.length >= 10
            ? activeDeck.cards.map(c => ({ ...c, id: Math.random().toString(36).substring(2, 11) }))
            : [];

        // Get selected hero
        const playerHero = activeDeck && activeDeck.heroId
            ? AVAILABLE_HEROES.find(h => h.id === activeDeck.heroId)
            : undefined;

        // Get unlocked talents from campaign
        const campaignState = useCampaignStore.getState();
        const unlockedTalentIds = campaignState.unlockedTalentIds;
        const heroTalentTree = playerHero ? getTalentTreeForHero(playerHero.id) : undefined;
        const playerTalents = heroTalentTree 
            ? heroTalentTree.talents.filter(t => unlockedTalentIds.includes(t.id)) 
            : [];

        const initialState = createInitialGameState(playerDeck, [], playerHero, undefined, playerTalents);

        // Reset EventBus and subscribe relics
        resetGlobalEventBus();
        const bus = getGlobalEventBus();
        const activeRelics = useCampaignStore.getState().relics.map(id => getRelicById(id)).filter(r => r !== undefined);

        activeRelics.forEach(relic => {
            if (!relic || !relic.isActive) return;
            bus.subscribe(relic.trigger, (event) => {
                const currentGameState = get();
                // Create a dummy card context for the relic
                const dummyCard: Card = {
                    id: relic.id,
                    name: relic.name,
                    type: 'spell', // Closest equivalent
                    rarity: relic.rarity === 'boss' ? 'legendary' : relic.rarity as any,
                    manaCost: 0, power: 0, attack: 0, artwork: null, description: relic.description,
                    abilities: []
                };

                const context: AbilityContext = {
                    state: currentGameState,
                    card: dummyCard,
                    player: 'player', // Relics are player-owned currently
                    updateState: () => { }, // Not used by generic effect resolving
                };

                resolveEffectGraph(relic.effect, context);
                // Effect graph mutates the state directly, we just force an update
                set({ ...currentGameState });
            });
        });

        set({
            ...initialState,
            difficulty,
            weather: { melee: false, ranged: false, siege: false },
            isAIThinking: false,
            winner: undefined,
            message: i18n.t('common.messages.game_started'),
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
            weather: state.weather,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
            attackingCardId: state.attackingCardId,
        };

        const bus = getGlobalEventBus();
        const { newState, success, message } = enginePlayCard(
            gameState,
            cardId,
            state.weather,
            bus
        );

        if (!success) {
            set({ message: message ? i18n.t(message) : i18n.t('common.messages.cannot_play') });
            return;
        }

        // VFX determination logic remains here as it's UI/Store concern...

        // Determine VFX
        let vfx: 'scorch' | 'boost' | 'revive' | 'frost' | 'fog' | 'none' = 'none';
        const mainAbility = card.abilities[0]?.type;
        if (mainAbility === 'destroy' || card.name.toLowerCase().includes('scorch') || card.name.toLowerCase().includes('void bolt')) {
            vfx = 'scorch';
        } else if (mainAbility === 'boost' || mainAbility === 'boost_row') {
            vfx = 'boost';
        } else if (mainAbility === 'revive') {
            vfx = 'revive';
        } else if (card.type === 'weather') {
            vfx = card.abilities[0]?.id === 'frost' ? 'frost' : 'fog';
        }

        set({
            ...newState,
            selectedCardId: null,
            message: i18n.t('common.messages.played_card', { name: i18n.t(`cards.${card.name}`) }),
        });

        // End turn after playing
        get().endTurn();
    },

    useHeroAbility: () => {
        const state = get();

        if (state.currentTurn !== 'player' || state.gameOver || state.isAIThinking) {
            return;
        }

        const bus = getGlobalEventBus();
        const { newState, success, message } = engineUseHeroAbility(state, bus);

        if (success) {
            set({
                ...newState,
                message: message ? i18n.t(message) : i18n.t('common.messages.used_hero_ability'),
            });
            // Hero ability is a FREE ACTION — does not end the turn.
            // Player can still play a card or pass after using it.
            // Player can still play a card or pass after using it.
        } else {
            set({ message: message ? i18n.t(message) : i18n.t('common.messages.cannot_use_ability') });
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
            weather: state.weather,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
            attackingCardId: state.attackingCardId,
        };

        const bus = getGlobalEventBus();
        const passedState = enginePassTurn(gameState, 'player', bus);

        if (shouldEndRound(passedState)) {
            const resolvedState = resolveRound(passedState, bus);

            if (resolvedState.gameOver) {
                set({
                    ...resolvedState,
                    phase: 'end',
                    message: resolvedState.winner === 'player' 
                        ? i18n.t('common.messages.victory') 
                        : (resolvedState.winner === 'draw' ? i18n.t('common.messages.stalemate') : i18n.t('common.messages.defeat')),
                });
            } else {
                const lastRound = resolvedState.roundHistory[resolvedState.roundHistory.length - 1];
                const roundWinner = lastRound.playerScore > lastRound.aiScore 
                    ? i18n.t('common.messages.you_won') 
                    : (lastRound.aiScore > lastRound.playerScore ? i18n.t('common.messages.ai_won') : i18n.t('common.messages.draw'));

                set({
                    ...resolvedState,
                    phase: 'round_end',
                    message: roundWinner,
                });
            }
        } else {
            // AI's turn
            set({
                ...passedState,
                message: i18n.t('common.messages.you_passed'),
            });
            get().endTurn();
        }
    },

    continueToNextRound: () => {
        const state = get();
        if (state.phase !== 'round_end') return;

        const nextRoundState = startNextRound(state);

        set({
            ...nextRoundState,
            weather: { melee: false, ranged: false, siege: false },
            message: i18n.t('common.messages.round_start', { num: nextRoundState.currentRound }),
        });

        // Check if AI goes first next round
        if (nextRoundState.currentTurn === 'ai') {
            get().triggerAI();
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
            weather: state.weather,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
            attackingCardId: state.attackingCardId,
        };

        const bus = getGlobalEventBus();
        const nextTurnState = engineEndTurn(gameState, bus);
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
            weather: state.weather,
            roundHistory: state.roundHistory,
            gameOver: state.gameOver,
            winner: state.winner,
            attackingCardId: state.attackingCardId,
        };

        const bus = getGlobalEventBus();
        const { newState, success, message } = attackUnit(gameState, attackerId, targetId, bus);

        if (success) {
            set({
                ...newState,
                attackingCardId: null, // Reset after attack
                message: i18n.t('common.messages.attack'),
            });
            // Update UI/Sound?
        } else {
            set({ message: message ? i18n.t(message) : i18n.t('common.messages.attack_failed'), attackingCardId: null });
        }
    },



    triggerAI: () => {
        const state = get();
        if (state.currentTurn === 'ai' && !state.ai.hasPassed) {
            set({ isAIThinking: true });

            const delay = getAIDelay(state.difficulty);

            // Wait for AI decision
            setTimeout(() => {
                const currentState = get();
                if (currentState.gameOver || currentState.currentTurn !== 'ai') {
                    set({ isAIThinking: false });
                    return;
                }

                const gameState: GameState = {
                    currentRound: currentState.currentRound,
                    roundsWon: currentState.roundsWon,
                    currentTurn: currentState.currentTurn,
                    phase: currentState.phase,
                    player: currentState.player,
                    ai: currentState.ai,
                    weather: currentState.weather,
                    roundHistory: currentState.roundHistory,
                    gameOver: currentState.gameOver,
                    winner: currentState.winner,
                    attackingCardId: currentState.attackingCardId,
                };

                const decision = makeAIDecision(gameState, currentState.difficulty);

                if (decision.action === 'pass') {
                    // AI passes
                    const aiGameState: GameState = {
                        currentRound: currentState.currentRound,
                        roundsWon: currentState.roundsWon,
                        currentTurn: 'ai',
                        phase: currentState.phase,
                        player: currentState.player,
                        ai: currentState.ai,
                        weather: currentState.weather,
                        roundHistory: currentState.roundHistory,
                        gameOver: currentState.gameOver,
                        winner: currentState.winner,
                        attackingCardId: currentState.attackingCardId,
                    };

                    const bus = getGlobalEventBus();
                    const aiPassedState = enginePassTurn(aiGameState, 'ai', bus);
                    // Swap currentTurn back to ai before checking
                    aiPassedState.currentTurn = 'ai';

                    // Check if round ends
                    if (currentState.player.hasPassed) {
                        const resolvedState = resolveRound(
                            { ...aiPassedState, ai: { ...aiPassedState.ai, hasPassed: true } },
                            bus
                        );

                        if (resolvedState.gameOver) {
                            set({
                                ...resolvedState,
                                phase: 'end',
                                isAIThinking: false,
                                message: resolvedState.winner === 'player' 
                                    ? i18n.t('common.messages.victory') 
                                    : (resolvedState.winner === 'draw' ? i18n.t('common.messages.stalemate') : i18n.t('common.messages.defeat')),
                            });
                        } else {
                            const lastRound = resolvedState.roundHistory[resolvedState.roundHistory.length - 1];
                            const roundWinner = lastRound.playerScore > lastRound.aiScore 
                                ? i18n.t('common.messages.you_won') 
                                : (lastRound.aiScore > lastRound.playerScore ? i18n.t('common.messages.ai_won') : i18n.t('common.messages.draw'));

                            set({
                                ...resolvedState,
                                phase: 'round_end',
                                isAIThinking: false,
                                message: roundWinner,
                            });
                        }
                    } else {
                        // Player's turn
                        set({
                            ...aiPassedState,
                            ai: { ...aiPassedState.ai, hasPassed: true },
                            currentTurn: 'player',
                            isAIThinking: false,
                            message: i18n.t('common.messages.ai_passed'),
                        });
                    }
                } else if (decision.action === 'ability') {
                    const abilityGameState: GameState = {
                        currentRound: currentState.currentRound,
                        roundsWon: currentState.roundsWon,
                        currentTurn: currentState.currentTurn,
                        phase: currentState.phase,
                        player: currentState.player,
                        ai: currentState.ai,
                        weather: currentState.weather,
                        roundHistory: currentState.roundHistory,
                        gameOver: currentState.gameOver,
                        winner: currentState.winner,
                        attackingCardId: currentState.attackingCardId,
                    };

                    const bus = getGlobalEventBus();
                    const { newState, success, message: abilityMsg } = engineUseHeroAbility(abilityGameState, bus);

                    if (success) {
                        set({
                            ...newState,
                            isAIThinking: false,
                            message: abilityMsg ? i18n.t(abilityMsg) : i18n.t('common.messages.ai_used_ability', { name: i18n.t(currentState.ai.hero.ability.name) }),
                        });
                        // AI ability is also a free action — re-trigger AI to play a card or pass
                        get().triggerAI();
                    } else {
                        // Fallback to pass if ability fails
                        set({ currentTurn: 'player', isAIThinking: false, message: i18n.t('common.messages.ai_passed') });
                    }
                } else if (decision.cardId) {
                    // AI plays a card
                    const playGameState: GameState = {
                        currentRound: currentState.currentRound,
                        roundsWon: currentState.roundsWon,
                        currentTurn: currentState.currentTurn,
                        phase: currentState.phase,
                        player: currentState.player,
                        ai: currentState.ai,
                        weather: currentState.weather,
                        roundHistory: currentState.roundHistory,
                        gameOver: currentState.gameOver,
                        winner: currentState.winner,
                        attackingCardId: currentState.attackingCardId,
                    };

                    const card = currentState.ai.hand.find(c => c.id === decision.cardId);

                    const bus = getGlobalEventBus();
                    const { newState } = enginePlayCard(
                        playGameState,
                        decision.cardId,
                        currentState.weather,
                        bus
                    );



                    set({
                        ...newState,
                        isAIThinking: false,
                        message: card 
                            ? i18n.t('common.messages.ai_played_card', { name: i18n.t(`cards.${card.name}`) }) 
                            : i18n.t('common.messages.ai_played_generic'),
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
        const state = get();
        if (cardId) {
            const card = state.player.hand.find(c => c.id === cardId) ||
                state.player.board.find(c => c.id === cardId);
            if (card) {
                set({
                    selectedCardId: cardId,
                    message: i18n.t('common.messages.card_info', { 
                        name: i18n.t(`cards.${card.name}`), 
                        desc: i18n.t(card.description || 'common.messages.no_description') 
                    })
                });
            } else {
                set({ selectedCardId: cardId });
            }
        } else {
            set({ selectedCardId: null, message: null });
        }
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
