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

// Easy - Plays sub-optimally with randomization
class EasyAI implements AIStrategy {
    evaluate(state: GameState): AIDecision {
        const aiHand = state.ai.hand;
        const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);
        
        if (affordableCards.length === 0) return { action: 'pass' };

        // 30% chance to play a completely random affordable card (novice mistake)
        if (Math.random() < 0.3) {
            const randomCard = affordableCards[Math.floor(Math.random() * affordableCards.length)];
            return { action: 'play', cardId: randomCard.id };
        }

        // Pick best unit, but 50% chance to forget hero ability
        if (Math.random() > 0.5 && state.ai.hero.ability.currentCooldown === 0 && getTotalPower(state, 'ai') < getTotalPower(state, 'player')) {
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

// Medium - Plays top powerful card available
class MediumAI implements AIStrategy {
    evaluate(state: GameState): AIDecision {
        const aiHand = state.ai.hand;
        const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);
        
        if (affordableCards.length === 0) return { action: 'pass' };

        if (state.ai.hero.ability.currentCooldown === 0 && getTotalPower(state, 'ai') < getTotalPower(state, 'player')) {
            const clone = deepCloneState(state);
            const { newState, success } = engineUseHeroAbility(clone);
            if (success && (getTotalPower(newState, 'ai') > getTotalPower(state, 'ai') || getTotalPower(newState, 'player') < getTotalPower(state, 'player'))) {
                return { action: 'ability' };
            }
        }

        const unitCards = affordableCards.filter(c => c.type === 'unit');
        if (unitCards.length > 0) {
            unitCards.sort((a, b) => (b.power || 0) - (a.power || 0));
            return { action: 'play', cardId: unitCards[0].id };
        }
        
        // For non-units (weather, spells), check if they actually help
        for (const card of affordableCards) {
            if (card.type === 'unit') continue;
            
            const clone = deepCloneState(state);
            const { newState, success } = enginePlayCard(clone, card.id, clone.weather);
            if (success) {
                const delta = (getTotalPower(newState, 'ai') - getTotalPower(newState, 'player')) - (getTotalPower(state, 'ai') - getTotalPower(state, 'player'));
                const handDelta = newState.ai.hand.length - state.ai.hand.length;
                if (delta > 0 || handDelta > 0) {
                    return { action: 'play', cardId: card.id };
                }
            }
        }
        
        return { action: 'pass' };
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
            hero: { ...state.player.hero, ability: { ...state.player.hero.ability } },
            unlockedTalents: state.player.unlockedTalents ? [...state.player.unlockedTalents] : []
        },
        ai: {
            ...state.ai,
            hand: state.ai.hand.map(c => ({...c})),
            board: state.ai.board.map(c => ({...c})),
            graveyard: state.ai.graveyard.map(c => ({...c})),
            hero: { ...state.ai.hero, ability: { ...state.ai.hero.ability } },
            unlockedTalents: state.ai.unlockedTalents ? [...state.ai.unlockedTalents] : []
        }
    };
};

// Hard - Simulates board state effects with tactical passing
class HardAI implements AIStrategy {
    evaluate(state: GameState): AIDecision {
        const aiHand = state.ai.hand;
        const affordableCards = aiHand.filter(c => c.manaCost <= state.ai.mana);
        
        const currentAIPower = getTotalPower(state, 'ai');
        const currentPlayerPower = getTotalPower(state, 'player');

        // TACTICAL PASSING
        // 1. If we already won the round and player passed, STOP immediately.
        if (state.player.hasPassed && currentAIPower > currentPlayerPower) {
            return { action: 'pass' };
        }

        // 2. If it's hopeless (player passed and even our strongest card can't win)
        if (state.player.hasPassed && affordableCards.length > 0) {
            const bestUnit = [...affordableCards].sort((a, b) => (b.power || 0) - (a.power || 0))[0];
            if (currentAIPower + (bestUnit.power || 0) < currentPlayerPower) {
                return { action: 'pass' };
            }
        }
        
        // 3. Early pass if we are far ahead to conserve cards
        if (!state.player.hasPassed && currentAIPower > currentPlayerPower + 20 && aiHand.length < 4) {
            return { action: 'pass' };
        }

        if (affordableCards.length === 0 && state.ai.hero.ability.currentCooldown > 0) {
            return { action: 'pass' };
        }

        let bestDecision: AIDecision = { action: 'pass' };
        const currentDelta = currentAIPower - currentPlayerPower;
        let bestDelta = currentDelta; 

        // 1. Evaluate Ability Simulation
        if (state.ai.hero.ability.currentCooldown === 0) {
            const clone = deepCloneState(state);
            const { newState, success } = engineUseHeroAbility(clone);
            if (success) {
                const delta = getTotalPower(newState, 'ai') - getTotalPower(newState, 'player');
                const handSizeDelta = newState.ai.hand.length - state.ai.hand.length;
                const healthDelta = newState.ai.health - state.ai.health;
                
                // Only use ability if it improves board power, gives card advantage, or heals
                if (delta > currentDelta || handSizeDelta > 0 || healthDelta > 0) {
                    // Bias it slightly so if multiple things give same delta, we prefer the "free" ability
                    const bonus = (handSizeDelta > 0 ? 10 : 0) + (healthDelta > 0 ? 5 : 0);
                    if (delta + 1 + bonus > bestDelta) {
                        bestDecision = { action: 'ability' };
                        bestDelta = delta + 1 + bonus;
                    }
                }
            }
        }

        // 2. Evaluate Card Playing Simulation (Includes Spells)
        const candidateCards = [...affordableCards].sort((a, b) => {
            // Prioritize spells for simulation as they have more complex board impacts
            if (a.type === 'spell' && b.type !== 'spell') return -1;
            if (a.type !== 'spell' && b.type === 'spell') return 1;
            return (b.power || 0) - (a.power || 0);
        }).slice(0, 8);
        
        for (const card of candidateCards) {
            const clone = deepCloneState(state);
            const { newState, success } = enginePlayCard(clone, card.id, clone.weather);
            if (success) {
                const delta = getTotalPower(newState, 'ai') - getTotalPower(newState, 'player');
                const handSizeDelta = newState.ai.hand.length - state.ai.hand.length;
                const healthDelta = newState.ai.health - state.ai.health;
                
                // Strategic Bias: High bonus for drawing cards (Spies/Medics)
                let bias = (handSizeDelta > 0 ? 15 : 0) + (healthDelta > 0 ? 5 : 0);
                
                // Only play if it improves the situation OR if it's a unit (units are rarely "wasted" early)
                const isBeneficial = delta > currentDelta || handSizeDelta > 0 || healthDelta > 0 || card.type === 'unit';
                
                if (isBeneficial && (delta + bias > bestDelta)) {
                    bestDecision = { action: 'play', cardId: card.id };
                    bestDelta = delta + bias;
                }
            }
        }

        return bestDecision;
    }
}

// Main AI decision coordinator
export const makeAIDecision = (state: GameState, difficulty: Difficulty): AIDecision => {
    let strategy: AIStrategy;
    
    switch (difficulty) {
        case 'easy':
            strategy = new EasyAI();
            break;
        case 'hard':
            strategy = new HardAI();
            break;
        case 'medium':
        default:
            strategy = new MediumAI();
            break;
    }
    
    return strategy.evaluate(state);
};

export const getAIDelay = (difficulty: Difficulty): number => {
    switch (difficulty) {
        case 'easy': return 1500;
        case 'hard': return 600;
        case 'medium':
        default: return 1000;
    }
};
