import { GameState, Difficulty, RowType, PlayerType } from '../types';
import { Card } from '../types';

// AI decision result
export interface AIDecision {
    action: 'play' | 'pass';
    cardId?: string;
    targetRow?: RowType;
}

// Get total power on board for a player
const getTotalPower = (state: GameState, player: PlayerType): number => {
    const board = state[player].board;
    return (
        board.melee.reduce((sum, c) => sum + (c.power || 0), 0) +
        board.ranged.reduce((sum, c) => sum + (c.power || 0), 0) +
        board.siege.reduce((sum, c) => sum + (c.power || 0), 0)
    );
};

// Easy AI: Random plays, passes when hand is low
const easyAI = (state: GameState): AIDecision => {
    const aiHand = state.ai.hand;
    const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);

    // Pass if no affordable cards or random chance
    if (affordableCards.length === 0 || (aiHand.length <= 2 && Math.random() > 0.7)) {
        return { action: 'pass' };
    }

    // Play random affordable card
    const card = affordableCards[Math.floor(Math.random() * affordableCards.length)];
    const targetRow = card.row || (['melee', 'ranged', 'siege'][Math.floor(Math.random() * 3)] as RowType);

    return { action: 'play', cardId: card.id, targetRow };
};

// Medium AI: Plays highest power cards, strategic passing
const mediumAI = (state: GameState): AIDecision => {
    const aiHand = state.ai.hand;
    const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);

    const aiPower = getTotalPower(state, 'ai');
    const playerPower = getTotalPower(state, 'player');

    // Strategic passing
    if (affordableCards.length === 0) {
        return { action: 'pass' };
    }

    // If significantly ahead and player has passed, pass to save cards
    if (state.player.hasPassed && aiPower > playerPower + 5) {
        return { action: 'pass' };
    }

    // If behind or close, play highest power unit
    const unitCards = affordableCards.filter(c => c.type === 'unit');
    if (unitCards.length > 0) {
        // Sort by power descending
        unitCards.sort((a, b) => (b.power || 0) - (a.power || 0));
        const card = unitCards[0];
        return { action: 'play', cardId: card.id, targetRow: card.row };
    }

    // Play any spell/weather
    if (affordableCards.length > 0) {
        const card = affordableCards[0];
        return { action: 'play', cardId: card.id, targetRow: card.row || 'melee' };
    }

    return { action: 'pass' };
};

// Hard AI: Uses abilities strategically, bluffs
const hardAI = (state: GameState): AIDecision => {
    const aiHand = state.ai.hand;
    const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);

    const aiPower = getTotalPower(state, 'ai');
    const playerPower = getTotalPower(state, 'player');
    const roundsRemaining = 3 - state.currentRound;
    const aiRoundsWon = state.roundsWon.ai;
    const playerRoundsWon = state.roundsWon.player;

    if (affordableCards.length === 0) {
        return { action: 'pass' };
    }

    // If already won enough rounds, pass to end game
    if (aiRoundsWon >= 2) {
        return { action: 'pass' };
    }

    // Strategic sacrifice: if player ahead and it's early, save cards for later rounds
    if (playerPower > aiPower + 15 && roundsRemaining > 0 && aiHand.length > 4) {
        return { action: 'pass' };
    }

    // If player passed and we're winning, pass
    if (state.player.hasPassed && aiPower > playerPower) {
        return { action: 'pass' };
    }

    // Prioritize spells with powerful effects when behind
    if (playerPower > aiPower + 10) {
        const spells = affordableCards.filter(c => c.type === 'spell');
        if (spells.length > 0) {
            const card = spells[0];
            return { action: 'play', cardId: card.id, targetRow: 'melee' };
        }
    }

    // Play units strategically - spread across rows
    const unitCards = affordableCards.filter(c => c.type === 'unit');
    if (unitCards.length > 0) {
        // Check row populations and play to least populated
        const rowCounts = {
            melee: state.ai.board.melee.length,
            ranged: state.ai.board.ranged.length,
            siege: state.ai.board.siege.length,
        };

        // Find cards that can go to the least populated row
        const sortedRows = Object.entries(rowCounts).sort((a, b) => a[1] - b[1]);

        for (const [row] of sortedRows) {
            const cardsForRow = unitCards.filter(c => c.row === row);
            if (cardsForRow.length > 0) {
                // Sort by power, play highest
                cardsForRow.sort((a, b) => (b.power || 0) - (a.power || 0));
                return { action: 'play', cardId: cardsForRow[0].id, targetRow: row as RowType };
            }
        }

        // Just play highest power unit to its preferred row
        unitCards.sort((a, b) => (b.power || 0) - (a.power || 0));
        const card = unitCards[0];
        return { action: 'play', cardId: card.id, targetRow: card.row };
    }

    // Weather cards - use strategically
    const weatherCards = affordableCards.filter(c => c.type === 'weather');
    if (weatherCards.length > 0 && playerPower > aiPower) {
        // Find row with most enemy power
        const playerRows = {
            melee: state.player.board.melee.reduce((s, c) => s + (c.power || 0), 0),
            ranged: state.player.board.ranged.reduce((s, c) => s + (c.power || 0), 0),
            siege: state.player.board.siege.reduce((s, c) => s + (c.power || 0), 0),
        };

        const targetRow = Object.entries(playerRows)
            .sort((a, b) => b[1] - a[1])[0][0] as RowType;

        const card = weatherCards[0];
        return { action: 'play', cardId: card.id, targetRow };
    }

    return { action: 'pass' };
};

// Main AI decision function
export const makeAIDecision = (state: GameState, difficulty: Difficulty): AIDecision => {
    switch (difficulty) {
        case 'easy':
            return easyAI(state);
        case 'medium':
            return mediumAI(state);
        case 'hard':
            return hardAI(state);
        default:
            return mediumAI(state);
    }
};

// Simulate thinking delay
export const getAIDelay = (difficulty: Difficulty): number => {
    switch (difficulty) {
        case 'easy':
            return 500;
        case 'medium':
            return 1000;
        case 'hard':
            return 1500;
        default:
            return 1000;
    }
};
