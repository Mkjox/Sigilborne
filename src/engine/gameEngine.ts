import { GameState, PlayerType, PlayerState, BoardRow, Difficulty, RowType } from '../types';
import { Card } from '../types';
import { createStarterDeck, createAIDeck } from '../data/cardData';
import { shuffleArray, drawCards, calculateBoardPower, executeAbility, AbilityContext } from './abilitySystem';

// Weather state tracking
export interface WeatherState {
    melee: boolean;
    ranged: boolean;
    siege: boolean;
}

// Constants
const STARTING_HAND_SIZE = 10;
const MAX_ROUNDS = 3;
const ROUNDS_TO_WIN = 2;

// Create initial player state
const createPlayerState = (id: string, type: PlayerType, deck: Card[]): PlayerState => {
    const shuffledDeck = shuffleArray(deck);
    const { newDeck, newHand } = drawCards(shuffledDeck, [], STARTING_HAND_SIZE);

    return {
        id,
        type,
        health: 2, // 2 "lives" for best of 3
        mana: 10, // Simplified: fixed mana per round
        maxMana: 10,
        deck: newDeck,
        hand: newHand,
        board: { melee: [], ranged: [], siege: [] },
        graveyard: [],
        hero: {
            id: `hero_${id}`,
            name: type === 'player' ? 'Commander' : 'Dark Lord',
            health: 2,
            maxHealth: 2,
            ability: {
                id: `ability_${id}`,
                name: type === 'player' ? 'Rally' : 'Dark Command',
                type: type === 'player' ? 'boost_all' : 'damage_strongest',
                trigger: 'activate',
                description: type === 'player' ? 'Boost all units by 1' : 'Deal 2 damage to strongest enemy',
                cooldown: 3,
                currentCooldown: 0,
            },
            artwork: type === 'player'
                ? require('../../assets/generated/hero_commander.png')
                : require('../../assets/generated/hero_darklord.png'),
            className: type === 'player' ? 'Warrior' : 'Warlock',
        },
        hasPassed: false,
    };
};

// Create initial game state
export const createInitialGameState = (difficulty: Difficulty, customPlayerDeck?: Card[] | null): GameState => {
    const playerDeck = customPlayerDeck || createStarterDeck();
    const aiDeck = createAIDeck();

    return {
        currentRound: 1,
        roundsWon: { player: 0, ai: 0 },
        currentTurn: 'player',
        phase: 'main',
        player: createPlayerState('player', 'player', playerDeck),
        ai: createPlayerState('ai', 'ai', aiDeck),
        roundHistory: [],
        gameOver: false,
    };
};

export const useHeroAbility = (state: GameState): { newState: GameState; success: boolean; message?: string } => {
    const currentPlayer = state.currentTurn;
    const playerState = state[currentPlayer];

    if (playerState.hero.ability.currentCooldown > 0) {
        return { newState: state, success: false, message: 'Ability on cooldown' };
    }

    const newState = { ...state };

    // Execute ability
    const ability = playerState.hero.ability;

    // Create a virtual card context for the ability
    const virtualCard: Card = {
        id: playerState.hero.id,
        name: playerState.hero.name,
        type: 'unit', // Fallback type
        rarity: 'legendary',
        manaCost: 0,
        abilities: [ability],
        description: ability.description,
        artwork: playerState.hero.artwork
    };

    const context: AbilityContext = {
        state: newState,
        card: virtualCard,
        player: currentPlayer,
        updateState: () => { },
    };

    executeAbility(ability, context);

    // Set cooldown (single use for now, so massive cooldown)
    newState[currentPlayer].hero.ability.currentCooldown = 99;

    return { newState, success: true, message: `Used ${ability.name}` };
};

// Play a card from hand to board
export const playCard = (
    state: GameState,
    cardId: string,
    targetRow: RowType,
    weather: WeatherState
): { newState: GameState; success: boolean; message?: string } => {
    const currentPlayer = state.currentTurn;
    const playerState = state[currentPlayer];

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
        const row = card.row || targetRow;
        newState[currentPlayer].board = {
            ...newState[currentPlayer].board,
            [row]: [...newState[currentPlayer].board[row], { ...card }],
        };

        // Execute onPlay abilities
        card.abilities
            .filter(a => a.trigger === 'onPlay')
            .forEach(ability => {
                const context: AbilityContext = {
                    state: newState,
                    card,
                    player: currentPlayer,
                    targetRow: row,
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
                    targetRow,
                    updateState: () => { },
                };
                executeAbility(ability, context);
            });

        // Spells go to graveyard after use
        newState[currentPlayer].graveyard.push(card);
    } else if (card.type === 'weather') {
        // Weather effects are handled by the store
        newState[currentPlayer].graveyard.push(card);
    }

    return { newState, success: true };
};

// Pass turn for current player
export const passTurn = (state: GameState): GameState => {
    const currentPlayer = state.currentTurn;
    const newState = { ...state };

    newState[currentPlayer] = {
        ...newState[currentPlayer],
        hasPassed: true,
    };

    return newState;
};

// Switch to next player's turn
export const endTurn = (state: GameState): GameState => {
    const nextPlayer: PlayerType = state.currentTurn === 'player' ? 'ai' : 'player';

    return {
        ...state,
        currentTurn: nextPlayer,
    };
};

// Check if round should end
export const shouldEndRound = (state: GameState): boolean => {
    return state.player.hasPassed && state.ai.hasPassed;
};

// Calculate round winner and update state
export const resolveRound = (state: GameState, weather: WeatherState): GameState => {
    const playerPower = calculateBoardPower(state.player.board, weather);
    const aiPower = calculateBoardPower(state.ai.board, weather);

    const newState = { ...state };

    // Record round history
    newState.roundHistory.push({
        number: state.currentRound,
        playerScore: playerPower,
        aiScore: aiPower,
    });

    // Determine winner
    if (playerPower > aiPower) {
        newState.roundsWon.player += 1;
    } else if (aiPower > playerPower) {
        newState.roundsWon.ai += 1;
    }
    // Tie: no one wins the round

    // Check for game over
    if (newState.roundsWon.player >= ROUNDS_TO_WIN) {
        newState.gameOver = true;
        newState.winner = 'player';
    } else if (newState.roundsWon.ai >= ROUNDS_TO_WIN) {
        newState.gameOver = true;
        newState.winner = 'ai';
    } else if (newState.currentRound >= MAX_ROUNDS) {
        // After 3 rounds, determine winner by rounds won
        newState.gameOver = true;
        newState.winner = newState.roundsWon.player > newState.roundsWon.ai ? 'player' : 'ai';
    }

    return newState;
};

// Setup next round
export const startNextRound = (state: GameState): GameState => {
    // Move all board cards to graveyard
    const moveToGraveyard = (player: PlayerState): PlayerState => {
        const allBoardCards = [
            ...player.board.melee,
            ...player.board.ranged,
            ...player.board.siege,
        ];

        return {
            ...player,
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [...player.graveyard, ...allBoardCards],
            hasPassed: false,
            mana: player.maxMana, // Restore mana
        };
    };

    // Draw 2 cards for new round
    const drawForRound = (player: PlayerState): PlayerState => {
        const { newDeck, newHand } = drawCards(player.deck, player.hand, 2);
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
        player: newPlayer,
        ai: newAI,
    };
};

// Get row power for display
export const getRowPower = (cards: Card[], hasWeather: boolean): number => {
    if (hasWeather) return cards.length; // All units reduced to 1
    return cards.reduce((sum, card) => sum + (card.power || 0), 0);
};

// Get total player power
export const getTotalPower = (board: BoardRow, weather: WeatherState): number => {
    return (
        getRowPower(board.melee, weather.melee) +
        getRowPower(board.ranged, weather.ranged) +
        getRowPower(board.siege, weather.siege)
    );
};
