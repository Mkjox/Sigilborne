import { GameState, Difficulty, PlayerType } from '../types';
import { Card } from '../types';

// AI decision result
export interface AIDecision {
    action: 'play' | 'pass';
    cardId?: string;
    // targetRow removed
}

// Get total power on board for a player
const getTotalPower = (state: GameState, player: PlayerType): number => {
    const board = state[player].board;
    return board.reduce((sum, c) => sum + (c.power || 0), 0);
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
    // const targetRow = card.row || (['melee', 'ranged', 'siege'][Math.floor(Math.random() * 3)] as RowType);

    return { action: 'play', cardId: card.id };
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
        return { action: 'play', cardId: card.id };
    }

    // Play any spell/weather
    if (affordableCards.length > 0) {
        const card = affordableCards[0];
        return { action: 'play', cardId: card.id };
    }

    return { action: 'pass' };
};

// Hard AI: Uses abilities strategically, bluffs
const hardAI = (state: GameState): AIDecision => {
    const aiHand = state.ai.hand;
    const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);

    // Calculate total scores
    const aiPower = getTotalPower(state, 'ai');
    const playerPower = getTotalPower(state, 'player');
    const roundsRemaining = 3 - state.currentRound;
    // const aiRoundsWon = state.roundsWon.ai;

    if (affordableCards.length === 0) {
        return { action: 'pass' };
    }

    // 1. Victory Condition: If we can pass and win the round/game, do it.
    if (state.player.hasPassed && aiPower > playerPower) {
        return { action: 'pass' };
    }

    // 2. Early Game Spy: Play spies early to get card advantage
    const spyCards = affordableCards.filter(c => c.abilities.some(a => a.type === 'spy'));
    if (spyCards.length > 0) {
        return { action: 'play', cardId: spyCards[0].id };
    }

    // 3. Smart Weather: Neutralize biggest threat
    const weatherCards = affordableCards.filter(c => c.type === 'weather');
    if (weatherCards.length > 0 && playerPower > aiPower + 10) {
        // Since weather is simplified/removed, we just play it if we have it and are losing bad, hoping for ability effect
        // or just prioritize units.
        // For now, let's skip complex weather logic as rows are gone.
    }

    // 4. Strategic Sacrifice: If opponent is way ahead, save cards
    if (playerPower > aiPower + 20 && roundsRemaining > 0 && !state.player.hasPassed) {
        // Don't waste cards if we're going to lose anyway
        return { action: 'pass' };
    }

    // 5. Play Strongest Unit
    const unitCards = affordableCards.filter(c => c.type === 'unit');
    if (unitCards.length > 0) {
        // Sort by power
        unitCards.sort((a, b) => (b.power || 0) - (a.power || 0));

        // Try to combo if possible (e.g. Tight Bond)
        const boardCards = state.ai.board;
        const comboCard = unitCards.find(c => boardCards.some(b => b.name === c.name && c.abilities.some(a => a.type === 'bond')));

        if (comboCard) {
            return { action: 'play', cardId: comboCard.id };
        }

        const bestCard = unitCards[0];
        return { action: 'play', cardId: bestCard.id };
    }

    // 6. Fallback: Play anything else (Spells/Weather not used above)
    return { action: 'play', cardId: affordableCards[0].id };
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
