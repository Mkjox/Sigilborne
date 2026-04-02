import { 
    Card, 
    Ability, 
    TargetSelector, 
    OperationType, 
    EffectGraph,
    Talent 
} from '../types';
import { GameState, PlayerType, BoardState } from '../types';
import { BOND_MULTIPLIER, STARTING_HEALTH } from './rules';
import { EventBus } from './eventBus';

// Game context passed to ability effects
export interface AbilityContext {
    state: GameState;
    card: Card;
    player: PlayerType;
    eventBus?: EventBus;
    // targetRow removed
    updateState: (updates: Partial<GameState>) => void;
}

// Get all cards for both players (Single Zone)
export const getBoardCards = (state: GameState): { player: Card[]; ai: Card[] } => ({
    player: state.player.board,
    ai: state.ai.board,
});

// Calculate total board power for a player
export const calculateBoardPower = (
    board: BoardState,
    activeWeather: { melee: boolean; ranged: boolean; siege: boolean },
    opponentBoard?: BoardState,
    talents: Talent[] = []
): number => {
    let totalPower = 0;

    // Collect faction boosts from talents
    const factionBoosts: Record<string, number> = {};
    talents.forEach(t => {
        if (t.effect.type === 'faction_bonus') {
            factionBoosts[t.effect.faction] = (factionBoosts[t.effect.faction] || 0) + t.effect.attackBoost;
        }
    });

    board.forEach(card => {
        let power = card.power || 0;

        // Apply global weather
        const isWeatherAffected =
            (card.category === 'melee' && activeWeather.melee) ||
            (card.category === 'ranged' && activeWeather.ranged) ||
            (card.category === 'siege' && activeWeather.siege);

        if (isWeatherAffected) {
            // Keep any boosts that were applied above the base power
            const base = card.basePower || 0;
            const boost = Math.max(0, power - base);
            power = 1 + boost;
        }

        // Apply Faction Bonus from Talents
        if (card.faction && factionBoosts[card.faction]) {
            power += factionBoosts[card.faction];
        }

        // Bond (Tight Bond) - Check only within own board
        const count = board.filter(c => c.name === card.name).length;
        if (count > 1 && card.abilities.some(a => a.type === 'bond')) {
            power *= BOND_MULTIPLIER;
        }

        totalPower += power;
    });

    return totalPower;
};

// Shuffle an array (Fisher-Yates)
export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Draw cards from deck
export const drawCards = (deck: Card[], hand: Card[], count: number): { newDeck: Card[]; newHand: Card[] } => {
    const cardsToDraw = Math.min(count, deck.length);
    const drawnCards = deck.slice(0, cardsToDraw);
    const newDeck = deck.slice(cardsToDraw);
    const newHand = [...hand, ...drawnCards];
    return { newDeck, newHand };
};

// Effect handlers for different ability types
export const abilityEffects = {
    // Boost adjacent units
    // Boost adjacent units
    boost: (context: AbilityContext): void => {
        const { state, card, player } = context;
        if (!card.abilities[0]?.value) return;

        const playerState = player === 'player' ? state.player : state.ai;
        const board = playerState.board;
        const cardIndex = board.findIndex(c => c.id === card.id);

        if (cardIndex === -1) return;

        // Boost adjacent cards
        const boostValue = card.abilities[0].value;
        if (cardIndex > 0) {
            const left = board[cardIndex - 1];
            left.power = (left.power || 0) + boostValue;
            context.eventBus?.emit('UNIT_BOOSTED', { targetId: left.id, amount: boostValue, player });
        }
        if (cardIndex < board.length - 1) {
            const right = board[cardIndex + 1];
            right.power = (right.power || 0) + boostValue;
            context.eventBus?.emit('UNIT_BOOSTED', { targetId: right.id, amount: boostValue, player });
        }
    },

    // Tight bond - double power when next to same name
    bond: (context: AbilityContext): void => {
        const { state, card, player } = context;

        const playerState = player === 'player' ? state.player : state.ai;
        const board = playerState.board;
        const sameNameCards = board.filter(c => c.name === card.name);

        // Double all cards with same name if there are multiples
        if (sameNameCards.length > 1) {
            sameNameCards.forEach(c => {
                const oldPower = c.power || 0;
                c.power = oldPower * BOND_MULTIPLIER;
                context.eventBus?.emit('UNIT_BOOSTED', { targetId: c.id, amount: c.power - oldPower, player });
            });
        }
    },

    // Spy - give card to enemy, draw cards
    // Spy - give card to enemy, draw cards
    spy: (context: AbilityContext): void => {
        const { state, card, player } = context;

        const drawCount = card.abilities[0]?.value || 2;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const enemyPlayer = player === 'player' ? 'ai' : 'player';

        // Card goes to enemy board
        state[enemyPlayer].board.push(card);

        // Draw cards for current player
        const { newDeck, newHand } = drawCards(
            state[currentPlayer].deck,
            state[currentPlayer].hand,
            drawCount
        );
        state[currentPlayer].deck = newDeck;
        state[currentPlayer].hand = newHand;
    },

    // Revive a unit from graveyard
    // Revive a unit from graveyard
    revive: (context: AbilityContext): void => {
        const { state, player } = context;

        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const graveyard = state[currentPlayer].graveyard;

        // Find first unit in graveyard
        const unitIndex = graveyard.findIndex(c => c.type === 'unit');
        if (unitIndex !== -1) {
            const revived = graveyard.splice(unitIndex, 1)[0];
            state[currentPlayer].board.push(revived);
            context.eventBus?.emit('ABILITY_TRIGGERED', { type: 'revive', cardId: revived.id, player: currentPlayer });
        }
    },

    // Destroy strongest units
    // Destroy strongest units
    destroy: (context: AbilityContext): void => {
        const { state, card } = context;

        // Find highest power across both boards
        const allUnits: { card: Card; owner: PlayerType }[] = [];

        state.player.board.forEach(c => allUnits.push({ card: c, owner: 'player' }));
        state.ai.board.forEach(c => allUnits.push({ card: c, owner: 'ai' }));

        if (allUnits.length === 0) return;

        // Filter out the card acting (so Dragon Hunter doesn't kill himself)
        const otherUnits = allUnits.filter(u => u.card.id !== card.id);

        if (otherUnits.length === 0) return;

        const maxPower = Math.max(...otherUnits.map(u => u.card.power || 0));
        const unitsToDestroy = otherUnits.filter(u => u.card.power === maxPower);

        // Destroy all units with max power
        unitsToDestroy.forEach(({ card: targetCard, owner }) => {
            const board = state[owner].board;
            const index = board.findIndex(c => c.id === targetCard.id);
            if (index !== -1) {
                const [removed] = board.splice(index, 1);
                state[owner].graveyard.push(removed);
                context.eventBus?.emit('CARD_DESTROYED', { cardId: targetCard.id, player: owner });
            }
        });
    },

    // Commander's Horn - double row power
    // Commander's Horn - double row power (Redefined as Boost All on Board for now)
    boost_row: (context: AbilityContext): void => {
        const { state, player } = context;
        // Effect same as boost_all for single zone
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        state[currentPlayer].board.forEach(card => {
            card.power = (card.power || 0) * 2;
        });
    },

    // Weather effects are handled separately in game engine
    weather: (_context: AbilityContext): void => {
        // Weather state is tracked in game engine
    },

    clear: (_context: AbilityContext): void => {
        // Clear weather is handled in game engine
    },
    
    decoy: (context: AbilityContext): void => {
        const { state, player } = context;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const board = state[currentPlayer].board;

        // Find non-hero units
        const validUnits = board.filter(c => c.type === 'unit' && !c.isHero);
        if (validUnits.length > 0) {
            // Pick a random unit
            const randomIndex = Math.floor(Math.random() * validUnits.length);
            const target = validUnits[randomIndex];

            // Remove from board
            board.splice(randomIndex, 1);

            // Re-add to hand
            // Reset its power to basePower
            target.power = target.basePower || 0;
            state[currentPlayer].hand.push(target);

            context.eventBus?.emit('ABILITY_TRIGGERED', { type: 'decoy', cardId: target.id, player: currentPlayer });
        }
    },

    // Rally - boost all friendly units
    // Rally - boost all friendly units
    boost_all: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const boostValue = card.abilities[0]?.value || 1;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const board = state[currentPlayer].board;

        board.forEach(c => {
            c.power = (c.power || 0) + boostValue;
        });
    },

    // Dark Command - damage strongest enemy
    // Dark Command - damage strongest enemy
    damage_strongest: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const damageValue = card.abilities[0]?.value || 2;
        const enemyPlayer = player === 'player' ? 'ai' : 'player';

        const allEnemyUnits: { card: Card }[] = [];
        state[enemyPlayer].board.forEach(c => allEnemyUnits.push({ card: c }));

        if (allEnemyUnits.length === 0) return;

        const maxPower = Math.max(...allEnemyUnits.map(u => u.card.power || 0));
        const targets = allEnemyUnits.filter(u => u.card.power === maxPower);

        if (targets.length > 0) {
            const target = targets[0];
            target.card.power = (target.card.power || 0) - damageValue;

            // Check death
            if (target.card.power <= 0) {
                const board = state[enemyPlayer].board;
                const idx = board.findIndex(c => c.id === target.card.id);
                if (idx !== -1) {
                    const [dead] = board.splice(idx, 1);
                    state[enemyPlayer].graveyard.push(dead);
                }
            }
        }
    },

    // Arcane Blast - damage all enemy units
    damage_all: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const damageValue = card.abilities[0]?.value || 1;
        const enemyPlayer = player === 'player' ? 'ai' : 'player';
        const board = state[enemyPlayer].board;

        for (let i = board.length - 1; i >= 0; i--) {
            board[i].power = (board[i].power || 0) - damageValue;
            if (board[i].power <= 0) {
                const [dead] = board.splice(i, 1);
                state[enemyPlayer].graveyard.push(dead);
            }
        }
    },

    // Precision Strike - destroy weakest enemy unit
    destroy_weakest: (context: AbilityContext): void => {
        const { state, player } = context;
        const enemyPlayer = player === 'player' ? 'ai' : 'player';
        const board = state[enemyPlayer].board;

        if (board.length === 0) return;

        const minPower = Math.min(...board.map(c => c.power || 0));
        const targets = board.filter(c => c.power === minPower);

        if (targets.length > 0) {
            const target = targets[0];
            const idx = board.findIndex(c => c.id === target.id);
            if (idx !== -1) {
                const [dead] = board.splice(idx, 1);
                state[enemyPlayer].graveyard.push(dead);
            }
        }
    },

    // Divine Light - heal hero
    heal: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const healValue = card.abilities[0]?.value || 2;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        
        state[currentPlayer].health = Math.min(
            state[currentPlayer].health + healValue,
            STARTING_HEALTH
        );
    },

    // Quick Dig - draw card
    draw_card: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const drawCount = card.abilities[0]?.value || 1;
        const currentPlayer = player === 'player' ? 'player' : 'ai';

        const { newDeck, newHand } = drawCards(
            state[currentPlayer].deck,
            state[currentPlayer].hand,
            drawCount
        );
        state[currentPlayer].deck = newDeck;
        state[currentPlayer].hand = newHand;
    },

    // Bloodlust - damage random enemy unit
    damage_random: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const damageValue = card.abilities[0]?.value || 1;
        const enemyPlayer = player === 'player' ? 'ai' : 'player';
        const board = state[enemyPlayer].board;

        if (board.length === 0) return;

        const randomIndex = Math.floor(Math.random() * board.length);
        const target = board[randomIndex];
        
        target.power = (target.power || 0) - damageValue;
        if (target.power <= 0) {
            board.splice(randomIndex, 1);
            state[enemyPlayer].graveyard.push(target);
        }
    },

    // Wild Growth - boost random friendly unit
    boost_random: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const boostValue = card.abilities[0]?.value || 2;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const board = state[currentPlayer].board;

        if (board.length === 0) return;

        const randomIndex = Math.floor(Math.random() * board.length);
        board[randomIndex].power = (board[randomIndex].power || 0) + boostValue;
    },
};

// ─── Effect Graph Resolution ────────────────────────────────────

/**
 * Resolve targets based on a TargetSelector.
 * Returns an array of card references that the operation should apply to.
 */
const resolveTargets = (
    selector: TargetSelector,
    context: AbilityContext
): Card[] => {
    const { state, card, player } = context;
    const currentPlayer = player === 'player' ? 'player' : 'ai';
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const allyBoard = state[currentPlayer].board;
    const enemyBoard = state[enemyPlayer].board;

    switch (selector.type) {
        case 'self':
            return [card];

        case 'adjacent': {
            const idx = allyBoard.findIndex(c => c.id === card.id);
            const targets: Card[] = [];
            if (idx > 0) targets.push(allyBoard[idx - 1]);
            if (idx < allyBoard.length - 1) targets.push(allyBoard[idx + 1]);
            return targets;
        }

        case 'all_allies':
            return [...allyBoard];

        case 'all_enemies':
            return [...enemyBoard];

        case 'strongest_enemy': {
            if (enemyBoard.length === 0) return [];
            const maxPower = Math.max(...enemyBoard.map(c => c.power || 0));
            return enemyBoard.filter(c => c.power === maxPower).slice(0, 1);
        }

        case 'weakest_enemy': {
            if (enemyBoard.length === 0) return [];
            const minPower = Math.min(...enemyBoard.map(c => c.power || 0));
            return enemyBoard.filter(c => c.power === minPower).slice(0, 1);
        }

        case 'random_enemy': {
            if (enemyBoard.length === 0) return [];
            return [enemyBoard[Math.floor(Math.random() * enemyBoard.length)]];
        }

        case 'random_ally': {
            if (allyBoard.length === 0) return [];
            return [allyBoard[Math.floor(Math.random() * allyBoard.length)]];
        }

        case 'all_units':
            return [...allyBoard, ...enemyBoard];

        default:
            return [];
    }
};

/**
 * Apply an operation to a set of resolved targets.
 */
const applyOperation = (
    operation: OperationType,
    targets: Card[],
    context: AbilityContext
): void => {
    const { state, player } = context;
    const currentPlayer = player === 'player' ? 'player' : 'ai';
    const enemyPlayer = player === 'player' ? 'ai' : 'player';

    switch (operation.type) {
        case 'boost':
            targets.forEach(t => {
                t.power = (t.power || 0) + operation.value;
                context.eventBus?.emit('UNIT_BOOSTED', { targetId: t.id, amount: operation.value, player });
            });
            break;

        case 'damage':
            targets.forEach(t => {
                t.power = (t.power || 0) - operation.value;
                context.eventBus?.emit('UNIT_DAMAGED', { targetId: t.id, damage: operation.value, player: context.player === 'player' ? 'ai' : 'player' });
                
                if (t.power <= 0) {
                    // Move to graveyard
                    const owner = state[currentPlayer].board.includes(t) ? currentPlayer : enemyPlayer;
                    const board = state[owner].board;
                    const idx = board.findIndex(c => c.id === t.id);
                    if (idx !== -1) {
                        const [dead] = board.splice(idx, 1);
                        state[owner].graveyard.push(dead);
                        context.eventBus?.emit('CARD_DESTROYED', { cardId: dead.id, player: owner });
                    }
                }
            });
            break;

        case 'destroy':
            targets.forEach(t => {
                const owner = state[currentPlayer].board.includes(t) ? currentPlayer : enemyPlayer;
                const board = state[owner].board;
                const idx = board.findIndex(c => c.id === t.id);
                if (idx !== -1) {
                    const [removed] = board.splice(idx, 1);
                    state[owner].graveyard.push(removed);
                    context.eventBus?.emit('CARD_DESTROYED', { cardId: removed.id, player: owner });
                }
            });
            break;

        case 'revive': {
            const graveyard = state[currentPlayer].graveyard;
            const unitIdx = graveyard.findIndex(c => c.type === 'unit');
            if (unitIdx !== -1) {
                const revived = graveyard.splice(unitIdx, 1)[0];
                state[currentPlayer].board.push(revived);
                context.eventBus?.emit('ABILITY_TRIGGERED', { type: 'revive', cardId: revived.id, player: currentPlayer });
            }
            break;
        }

        case 'draw': {
            const { newDeck, newHand } = drawCards(
                state[currentPlayer].deck,
                state[currentPlayer].hand,
                operation.value
            );
            state[currentPlayer].deck = newDeck;
            state[currentPlayer].hand = newHand;
            context.eventBus?.emit('CARD_DRAWN', { count: operation.value, player: currentPlayer });
            break;
        }

        case 'heal': {
            const { STARTING_HEALTH: maxHealth } = require('./rules');
            state[currentPlayer].health = Math.min(
                state[currentPlayer].health + operation.value,
                maxHealth
            );
            context.eventBus?.emit('UNIT_HEALED', { targetId: state[currentPlayer].hero.id, amount: operation.value, player: currentPlayer });
            break;
        }

        case 'multiply':
            targets.forEach(t => {
                const old = t.power || 0;
                t.power = old * operation.value;
                if (t.power > old) {
                    context.eventBus?.emit('UNIT_BOOSTED', { targetId: t.id, amount: t.power - old, player });
                } else if (t.power < old) {
                     context.eventBus?.emit('UNIT_DAMAGED', { targetId: t.id, damage: old - t.power, player: context.player === 'player' ? 'ai' : 'player' });
                }
            });
            break;
    }
};

/**
 * Execute an EffectGraph: resolve targets → apply operation.
 */
export const resolveEffectGraph = (
    graph: EffectGraph,
    context: AbilityContext
): void => {
    const targets = resolveTargets(graph.target, context);
    applyOperation(graph.operation, targets, context);
};

// ─── Main Entry Point ───────────────────────────────────────────
/**
 * Execute an ability. Prefers the new EffectGraph when present,
 * falls back to legacy type-string handlers for backward compatibility.
 */
export const executeAbility = (
    ability: { type: string; effectGraph?: EffectGraph },
    context: AbilityContext
): void => {
    // Emit general trigger event for all abilities
    context.eventBus?.emit('ABILITY_TRIGGERED', { 
        type: ability.type, 
        cardId: context.card.id, 
        player: context.player 
    });

    // Prefer EffectGraph if available
    if (ability.effectGraph) {
        resolveEffectGraph(ability.effectGraph, context);
        return;
    }

    // Legacy fallback
    const effect = abilityEffects[ability.type as keyof typeof abilityEffects];
    if (effect) {
        effect(context);
    }
};
