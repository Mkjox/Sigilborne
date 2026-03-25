import { GameState, PlayerType, PlayerState, BoardState, Difficulty, RoundInfo, TurnPhase, Faction } from '../types';
import { Card } from '../types';
import { createStarterDeck, createAIDeck } from '../data/cardData';
import { shuffleArray, drawCards, calculateBoardPower, executeAbility, AbilityContext } from './abilitySystem';
import { Hero, Talent } from '../types/hero.types';
import { AVAILABLE_HEROES } from '../data/cardData';
import { STARTING_HAND_SIZE, MAX_ROUNDS, ROUNDS_TO_WIN, MANA_PER_ROUND, STARTING_HEALTH, DRAW_PER_ROUND } from './rules';
import { EventBus } from './eventBus';

// Weather state tracking
export interface WeatherState {
    melee: boolean;
    ranged: boolean;
    siege: boolean;
}

// ─── Turn Phase Helpers ─────────────────────────────────────────
export const advanceTurnPhase = (state: GameState, eventBus?: EventBus): GameState => {
    if (state.gameOver || state[state.currentTurn].hasPassed) return state;

    const newState = { ...state };
    const current = state.currentTurn;

    switch (state.turnPhase) {
        case 'start_of_turn':
            newState.turnPhase = 'main';
            // Here is where 'passive' start_of_turn abilities would fire
            break;
        case 'main':
            newState.turnPhase = 'combat';
            break;
        case 'combat':
            newState.turnPhase = 'end_of_turn';
            // Auto-advance to next player's start_of_turn
            return endTurn(newState, eventBus);
        case 'end_of_turn':
        default:
            newState.turnPhase = 'start_of_turn';
            eventBus?.emit('TURN_STARTED', { player: current });
            break;
    }
    return newState;
};

// Constants are now imported from './rules'

// Create initial player state
const createPlayerState = (id: string, type: PlayerType, deck: Card[], hero?: Hero, talents: Talent[] = []): PlayerState => {
    const shuffledDeck = shuffleArray(deck);
    const { newDeck, newHand } = drawCards(shuffledDeck, [], STARTING_HAND_SIZE);

    // Apply Talent Stat Boosts
    let healthBonus = 0;
    let manaBonus = 0;
    let cooldownReduction = 0;

    talents.forEach(talent => {
        if (talent.effect.type === 'stat_boost') {
            if (talent.effect.target === 'hero_health') healthBonus += talent.effect.value;
            if (talent.effect.target === 'starting_mana') manaBonus += talent.effect.value;
            if (talent.effect.target === 'hero_power_cooldown') cooldownReduction += talent.effect.value;
        }
    });

    const baseHealth = STARTING_HEALTH + healthBonus;
    const baseMana = MANA_PER_ROUND + manaBonus;

    const heroState: Hero = hero ? { 
        ...hero, 
        id: `hero_${id}`, 
        ability: { 
            ...hero.ability, 
            cooldown: Math.max(1, hero.ability.cooldown - cooldownReduction),
            currentCooldown: 0 
        } 
    } : {
        id: `hero_${id}`,
        name: type === 'player' ? 'Commander' : 'Dark Lord',
        health: 2 + healthBonus,
        maxHealth: 2 + healthBonus,
        faction: (type === 'player' ? 'order' : 'shadow') as Faction,
        ability: {
            id: `ability_${id}`,
            name: type === 'player' ? 'Rally' : 'Dark Command',
            type: type === 'player' ? 'boost_all' : 'damage_strongest',
            trigger: 'activate',
            description: type === 'player' ? 'Boost all units by 1' : 'Deal 2 damage to strongest enemy',
            cooldown: Math.max(1, 3 - cooldownReduction),
            currentCooldown: 0,
        },
        artwork: type === 'player'
            ? require('../../assets/heroes/hero_commander.jpg')
            : require('../../assets/heroes/hero_darklord.jpg'),
        className: type === 'player' ? 'Warrior' : 'Warlock',
    };

    return {
        id,
        type,
        health: baseHealth,
        mana: baseMana,
        maxMana: baseMana,
        deck: newDeck,
        hand: newHand,
        board: [],
        graveyard: [],
        hero: heroState,
        hasPassed: false,
        unlockedTalents: talents,
    };
};

// ... initial game state ...

// Play a card from hand to board
export const playCard = (
    state: GameState,
    cardId: string,
    // targetRow: RowType, // REMOVED
    weather: WeatherState,
    eventBus?: EventBus
): { newState: GameState; success: boolean; message?: string } => {
    const currentPlayer = state.currentTurn;
    const playerState = state[currentPlayer];

    // phase check removed to allow playing cards without a UI phase-advance button

    // Find card in hand
    const cardIndex = playerState.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        return { newState: state, success: false, message: 'Card not in hand' };
    }

    const card = playerState.hand[cardIndex];

    // Check mana cost
    const manaCost = card.manaCost ?? 0;
    if (manaCost > playerState.mana) {
        return { newState: state, success: false, message: 'Not enough mana' };
    }

    // Remove from hand
    const newHand = [...playerState.hand];
    newHand.splice(cardIndex, 1);

    // Deduct mana
    const newMana = playerState.mana - manaCost;

    // Create new state
    const newState = { ...state };
    newState[currentPlayer] = {
        ...playerState,
        hand: newHand,
        mana: newMana,
    };

    // Handle different card types
    if (card.type === 'unit') {
        // Add to single board array
        newState[currentPlayer].board = [...newState[currentPlayer].board, { ...card }];

        // Execute onPlay abilities
        card.abilities
            .filter(a => a.trigger === 'onPlay')
            .forEach(ability => {
                const context: AbilityContext = {
                    state: newState,
                    card,
                    player: currentPlayer,
                    eventBus,
                    updateState: () => { },
                };
                executeAbility(ability, context);
            });
    } else if (card.type === 'spell') {
        // Execute spell effects
        card.abilities
            .filter(a => a.trigger === 'onPlay')
            .forEach(ability => {
                const context: AbilityContext = {
                    state: newState,
                    card,
                    player: currentPlayer,
                    eventBus,
                    updateState: () => { },
                };
                executeAbility(ability, context);
            });

        // Spells go to graveyard after use
        newState[currentPlayer].graveyard.push(card);
    } else if (card.type === 'weather') {
        // Weather effects are handled by the store
        newState[currentPlayer].graveyard.push(card);
    } else {
        // Fallback for any other type to avoid "disappearing" cards
        console.warn(`Unknown card type: ${(card as any).type}, moving to graveyard`);
        newState[currentPlayer].graveyard.push(card);
    }

    // Emit event
    eventBus?.emit('CARD_PLAYED', { cardId, cardName: card.name, cardType: card.type, player: currentPlayer });

    return { newState, success: true };
};

// Initialize a new game state
export const createInitialGameState = (
    playerDeck: Card[] = [], 
    aiDeck: Card[] = [], 
    playerHero?: Hero, 
    aiHero?: Hero,
    playerTalents: Talent[] = [],
    aiTalents: Talent[] = []
): GameState => {
    return {
        currentRound: 1,
        roundsWon: { player: 0, ai: 0 },
        currentTurn: 'player', // Player always starts first round
        phase: 'mulligan',
        player: createPlayerState('player', 'player', playerDeck.length > 0 ? playerDeck : createStarterDeck(), playerHero, playerTalents),
        ai: createPlayerState('ai', 'ai', aiDeck.length > 0 ? aiDeck : createAIDeck(), aiHero, aiTalents),
        weather: { melee: false, ranged: false, siege: false },
        roundHistory: [],
        gameOver: false,
        turnPhase: 'start_of_turn',
    };
};

// Pass turn
export const passTurn = (state: GameState, playerType: PlayerType, eventBus?: EventBus): GameState => {
    const newState = { ...state };
    newState[playerType].hasPassed = true;
    eventBus?.emit('PLAYER_PASSED', { player: playerType });

    // Round resolution is now handled by the store (orchestrator)
    // to allow for UI pauses/transitions.

    // Switch turn logic handled in endTurn usually, but if passed, we just give control to other
    return endTurn(newState);
};

// Helper to handle unit death
const checkDeaths = (state: GameState): GameState => {
    const newState = { ...state };

    (['player', 'ai'] as PlayerType[]).forEach((playerType) => {
        const currentPlayerState = newState[playerType];
        const deadUnits = currentPlayerState.board.filter(c => (c.power || 0) <= 0);

        if (deadUnits.length > 0) {
            newState[playerType] = {
                ...currentPlayerState,
                graveyard: [...currentPlayerState.graveyard, ...deadUnits],
                board: currentPlayerState.board.filter(c => (c.power || 0) > 0)
            };
        }
    });

    return newState;
};

// Attack unit
export const attackUnit = (
    state: GameState,
    attackerId: string,
    targetId: string,
    eventBus?: EventBus
): { newState: GameState; success: boolean; message?: string } => {
    const currentPlayer = state.currentTurn;
    const opponent = currentPlayer === 'player' ? 'ai' : 'player';

    // 1. Find cards
    const attackerRef = state[currentPlayer].board.find(c => c.id === attackerId);
    const targetRef = state[opponent].board.find(c => c.id === targetId);

    if (!attackerRef || !targetRef) {
        return { newState: state, success: false, message: "Unit not found" };
    }

    // phase check removed to allow attacking without a UI phase-advance button

    // 2. Validation
    if (attackerRef.isExhausted) {
        return { newState: state, success: false, message: "Unit is exhausted" };
    }

    // 3. Combat Math
    // Clone state to avoid mutation
    // Deep clone needed? We'll map the boards.
    const newState = { ...state };
    const newAttacker = { ...attackerRef };
    const newTarget = { ...targetRef };

    // Damage
    newTarget.power = (newTarget.power || 0) - newAttacker.attack;

    // Retaliation logic? Hearthstone has it.
    newAttacker.power = (newAttacker.power || 0) - newTarget.attack;

    // Exhaust attacker
    newAttacker.isExhausted = true;

    // Update boards
    newState[currentPlayer] = {
        ...state[currentPlayer],
        board: state[currentPlayer].board.map(c => c.id === attackerId ? newAttacker : c)
    };

    newState[opponent] = {
        ...state[opponent],
        board: state[opponent].board.map(c => c.id === targetId ? newTarget : c)
    };

    // 4. Death processing
    const finalState = checkDeaths(newState);

    // Emit events
    eventBus?.emit('UNIT_DAMAGED', { targetId, damage: newAttacker.attack, player: opponent });
    eventBus?.emit('UNIT_DAMAGED', { targetId: attackerId, damage: newTarget.attack, player: currentPlayer });
    if ((newTarget.power || 0) <= 0) {
        eventBus?.emit('CARD_DESTROYED', { cardId: targetId, player: opponent });
    }
    if ((newAttacker.power || 0) <= 0) {
        eventBus?.emit('CARD_DESTROYED', { cardId: attackerId, player: currentPlayer });
    }

    return { newState: finalState, success: true, message: "Attack successful" };
};

// End turn and switch active player
export const endTurn = (state: GameState, eventBus?: EventBus): GameState => {
    // If game over, do nothing
    if (state.gameOver) return state;

    const current = state.currentTurn;
    const opponent = current === 'player' ? 'ai' : 'player';

    // If opponent has passed, stay on current player
    if (state[opponent].hasPassed) {
        eventBus?.emit('TURN_ENDED', { player: current });
        if (state[current].hasPassed) {
            // Both passed. We return the state as-is.
            // The Store (orchestrator) will detect both passed and call resolveRound.
            return state;
        }
        // Current player keeps playing
        // Refresh units if it's "start of turn" conceptually? 
        // If opponent passed, I take another turn immediately. 
        // So my units should ready up?
        // Yes, start of MY turn.
        const refreshedPlayer = {
            ...state[current],
            board: state[current].board.map(c => ({ ...c, isExhausted: false }))
        };
        const newState = { ...state, turnPhase: 'start_of_turn' as TurnPhase };
        newState[current] = refreshedPlayer;
        eventBus?.emit('TURN_STARTED', { player: current });
        return newState;
    }

    eventBus?.emit('TURN_ENDED', { player: current });

    // Switch turn
    // Ready up the NEXT player's units
    const refreshedOpponent = {
        ...state[opponent],
        board: state[opponent].board.map(c => ({ ...c, isExhausted: false }))
    };

    const newState = { ...state, currentTurn: opponent as PlayerType, turnPhase: 'start_of_turn' as TurnPhase };
    newState[opponent] = refreshedOpponent;

    eventBus?.emit('TURN_STARTED', { player: opponent });

    return newState;
};

// Check if round should end
export const shouldEndRound = (state: GameState): boolean => {
    return state.player.hasPassed && state.ai.hasPassed;
};

// Resolve round winner
export const resolveRound = (state: GameState, eventBus?: EventBus): GameState => {
    const weather = { melee: false, ranged: false, siege: false }; // Weather removed/simplified
    const playerPower = calculateBoardPower(state.player.board, weather, state.ai.board, state.player.unlockedTalents);
    const aiPower = calculateBoardPower(state.ai.board, weather, state.player.board, state.ai.unlockedTalents);

    let winner: PlayerType | 'draw' = 'draw';
    if (playerPower > aiPower) winner = 'player';
    else if (aiPower > playerPower) winner = 'ai';

    // Update scores (gems)
    const roundsWon = { ...state.roundsWon };
    const playerHealth = state.player.health;
    const aiHealth = state.ai.health;

    // Gwent style: Winner gets a round point? Or loser loses a gem/life?
    // "Classic Gwent": 2 lives. Loser loses a life.
    // If draw, both lose a life.

    let newPlayerHealth = playerHealth;
    let newAIHealth = aiHealth;

    if (winner === 'player') {
        roundsWon.player += 1;
        newAIHealth -= 1;
    } else if (winner === 'ai') {
        roundsWon.ai += 1;
        newPlayerHealth -= 1;
    } else {
        // Draw - both lose life
        newPlayerHealth -= 1;
        newAIHealth -= 1;
    }

    // Record history
    const roundInfo: RoundInfo = {
        number: state.currentRound,
        playerScore: playerPower,
        aiScore: aiPower,
    };

    const newState = {
        ...state,
        roundsWon,
        player: { ...state.player, health: newPlayerHealth },
        ai: { ...state.ai, health: newAIHealth },
        roundHistory: [...state.roundHistory, roundInfo],
    };

    // Check Game Over
    if (newPlayerHealth <= 0 || newAIHealth <= 0) {
        // Game Over
        let gameWinner: PlayerType | 'draw' = 'draw';
        if (newPlayerHealth > 0 && newAIHealth <= 0) gameWinner = 'player';
        else if (newAIHealth > 0 && newPlayerHealth <= 0) gameWinner = 'ai';
        else gameWinner = 'draw'; // Both died same turn

        eventBus?.emit('GAME_OVER', { winner: gameWinner });
        return {
            ...newState,
            gameOver: true,
            winner: gameWinner,
        };
    }

    // Emit round end
    eventBus?.emit('ROUND_ENDED', { round: state.currentRound, playerPower, aiPower, winner });

    // Return the state showing the final scores and reduced health, 
    // but before the board is cleared for the next round.
    return newState;
};

// Use Hero Ability
export const useHeroAbility = (state: GameState, eventBus?: EventBus): { newState: GameState, success: boolean, message?: string } => {
    const player = state.currentTurn;
    const playerState = state[player];

    if (playerState.hero.ability.currentCooldown > 0) {
        return { newState: state, success: false, message: "Ability on cooldown" };
    }

    // Execute ability
    const abilityType = playerState.hero.ability.type;

    // Determine the correct value for each ability type
    let abilityValue = playerState.hero.ability.value ?? 0;
    if (abilityValue === 0) {
        // Fallback defaults based on ability type
        if (abilityType === 'boost_all') abilityValue = 1;
        else if (abilityType === 'damage_strongest') abilityValue = 2;
        else abilityValue = 1;
    }

    const dummyAbilityCard = {
        id: 'hero_ability',
        name: playerState.hero.ability.name,
        abilities: [{ type: abilityType, value: abilityValue }]
    } as Card;

    const context: AbilityContext = {
        state: state,
        card: dummyAbilityCard,
        player: player,
        eventBus: eventBus,
        updateState: () => { },
    };

    executeAbility(dummyAbilityCard.abilities[0], context);

    // Set cooldown to the hero's configured cooldown (resets each round)
    const newState = { ...state };
    newState[player].hero.ability.currentCooldown = playerState.hero.ability.cooldown;

    eventBus?.emit('HERO_ABILITY_USED', { player, abilityType, abilityName: playerState.hero.ability.name });

    return { newState, success: true, message: "Hero ability used" };
};

// Setup next round
export const startNextRound = (state: GameState): GameState => {
    // Move all board cards to graveyard and reset hero ability cooldown
    const moveToGraveyard = (player: PlayerState): PlayerState => {
        const allBoardCards = [...player.board];

        return {
            ...player,
            board: [],
            graveyard: [...player.graveyard, ...allBoardCards],
            hasPassed: false,
            mana: player.maxMana, // Restore mana
            hero: {
                ...player.hero,
                ability: {
                    ...player.hero.ability,
                    currentCooldown: 0, // Reset hero ability each round
                },
            },
        };
    };

    // ... rest of startNextRound ...

    // Draw 2 cards for new round
    const drawForRound = (player: PlayerState): PlayerState => {
        const { newDeck, newHand } = drawCards(player.deck, player.hand, DRAW_PER_ROUND);
        return {
            ...player,
            deck: newDeck,
            hand: newHand,
        };
    };

    let newPlayer = moveToGraveyard(state.player);
    newPlayer = drawForRound(newPlayer);

    let newAI = moveToGraveyard(state.ai);
    newAI = drawForRound(newAI);

    // Winner of previous round goes first
    const lastRound = state.roundHistory[state.roundHistory.length - 1];
    let nextStarter: PlayerType = 'player';
    if (lastRound && lastRound.aiScore > lastRound.playerScore) {
        nextStarter = 'ai';
    }

    return {
        ...state,
        currentRound: state.currentRound + 1,
        currentTurn: nextStarter,
        phase: 'main',
        turnPhase: 'start_of_turn',
        player: newPlayer,
        ai: newAI,
    };
};

export const getRowPower = (cards: Card[], hasWeather: boolean): number => {
    // Deprecated but kept for compatibility logic if needed
    if (hasWeather) return cards.length;
    return cards.reduce((sum, card) => sum + (card.power || 0), 0);
};

// Get total player power
export const getTotalPower = (board: BoardState, weather: WeatherState, opponentBoard?: BoardState): number => {
    return calculateBoardPower(board, weather, opponentBoard);
};
