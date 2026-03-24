import { GameState, Difficulty, PlayerType, Card } from '../types';
import { playCard as enginePlayCard } from './gameEngine';
import { useHeroAbility as engineUseHeroAbility } from './gameEngine';

// AI decision result
export interface AIDecision {
    action: 'play' | 'pass' | 'ability';
    cardId?: string;
}

// Get total power on board for a player
const getTotalPower = (state: GameState, player: PlayerType): number => {
    return state[player].board.reduce((sum, c) => sum + (c.power || 0), 0);
};

// Strategy pattern interface
export interface AIStrategy {
    evaluate(state: GameState): AIDecision;
}

// Easy/Medium - Plays top powerful card available
class HeuristicAI implements AIStrategy {
    evaluate(state: GameState): AIDecision {
        const aiHand = state.ai.hand;
        const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);
        
        if (affordableCards.length === 0) return { action: 'pass' };

        // Play hero ability blindly if available and behind
        if (state.ai.hero.ability.currentCooldown === 0 && getTotalPower(state, 'ai') < getTotalPower(state, 'player')) {
            return { action: 'ability' };
        }

        const unitCards = affordableCards.filter(c => c.type === 'unit');
        if (unitCards.length > 0) {
            unitCards.sort((a, b) => (b.power || 0) - (a.power || 0));
            return { action: 'play', cardId: unitCards[0].id };
        }
        
        return { action: 'play', cardId: affordableCards[0].id };
    }
}

// Helper to deep clone state for safe simulation
const deepCloneState = (state: GameState): GameState => {
    return {
        ...state,
        player: {
            ...state.player,
            hand: state.player.hand.map(c => ({...c})),
            board: state.player.board.map(c => ({...c})),
            graveyard: state.player.graveyard.map(c => ({...c})),
            hero: { ...state.player.hero, ability: { ...state.player.hero.ability } }
        },
        ai: {
            ...state.ai,
            hand: state.ai.hand.map(c => ({...c})),
            board: state.ai.board.map(c => ({...c})),
            graveyard: state.ai.graveyard.map(c => ({...c})),
            hero: { ...state.ai.hero, ability: { ...state.ai.hero.ability } }
        }
    };
};

// Hard - Simulates board state effects 1 turn deep (Lookahead AI)
class SimulationAI implements AIStrategy {
    evaluate(state: GameState): AIDecision {
        const aiHand = state.ai.hand;
        const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);
        
        const currentAIPower = getTotalPower(state, 'ai');
        const currentPlayerPower = getTotalPower(state, 'player');

        // Tactical passing
        if (state.player.hasPassed && currentAIPower > currentPlayerPower) {
            return { action: 'pass' };
        }
        
        if (affordableCards.length === 0 && state.ai.hero.ability.currentCooldown > 0) {
            return { action: 'pass' };
        }

        let bestDecision: AIDecision = { action: 'pass' };
        // Value heuristic: AI power - Player power
        let bestDelta = currentAIPower - currentPlayerPower; 

        // 1. Evaluate Ability Simulation
        if (state.ai.hero.ability.currentCooldown === 0) {
            const clone = deepCloneState(state);
            const { newState, success } = engineUseHeroAbility(clone);
            if (success) {
                const delta = getTotalPower(newState, 'ai') - getTotalPower(newState, 'player');
                // Give ability a slight bias (+1) since it costs no cards from hand
                if (delta + 1 > bestDelta) {
                    bestDecision = { action: 'ability' };
                    bestDelta = delta + 1;
                }
            }
        }

        // 2. Evaluate Card Playing Simulation
        // Limit to top 5 cards by power to avoid massive CPU load on mobile
        const candidateCards = [...affordableCards].sort((a, b) => (b.power || 0) - (a.power || 0)).slice(0, 5);
        
        for (const card of candidateCards) {
            const clone = deepCloneState(state);
            const { newState, success } = enginePlayCard(clone, card.id, clone.weather);
            if (success) {
                const delta = getTotalPower(newState, 'ai') - getTotalPower(newState, 'player');
                if (delta > bestDelta) {
                    bestDecision = { action: 'play', cardId: card.id };
                    bestDelta = delta;
                }
            }
        }

        // If no plays improved our situation and we're hopelessly behind, pass
        if (bestDecision.action === 'pass' && affordableCards.length > 0) {
           // But if we're not hopelessly behind, maybe play the best we have anyway
           if (currentAIPower <= currentPlayerPower) {
               return { action: 'play', cardId: candidateCards[0].id };
           }
        }

        return bestDecision;
    }
}

// Main AI decision coordinator
export const makeAIDecision = (state: GameState, difficulty: Difficulty): AIDecision => {
    const strategy = difficulty === 'hard' ? new SimulationAI() : new HeuristicAI();
    return strategy.evaluate(state);
};

export const getAIDelay = (difficulty: Difficulty): number => {
    return difficulty === 'hard' ? 1200 : 800;
};
