import { Card, RowType } from '../types';
import { GameState, PlayerType, BoardRow } from '../types';

// Game context passed to ability effects
export interface AbilityContext {
    state: GameState;
    card: Card;
    player: PlayerType;
    targetRow?: RowType;
    updateState: (updates: Partial<GameState>) => void;
}

// Get all cards on a specific row for both players
export const getRowCards = (state: GameState, row: RowType): { player: Card[]; ai: Card[] } => ({
    player: state.player.board[row],
    ai: state.ai.board[row],
});

// Calculate total power for a board row
export const calculateRowPower = (cards: Card[], hasWeather: boolean = false): number => {
    if (hasWeather) {
        // Weather reduces all units to 1 power
        return cards.length;
    }
    return cards.reduce((sum, card) => sum + (card.power || 0), 0);
};

// Calculate total board power for a player
// Calculate total board power for a player, considering Class Advantage
export const calculateBoardPower = (
    board: BoardRow,
    activeWeather: { melee: boolean; ranged: boolean; siege: boolean },
    opponentBoard?: BoardRow
): number => {
    let meleePower = calculateRowPower(board.melee, activeWeather.melee);
    let rangedPower = calculateRowPower(board.ranged, activeWeather.ranged);
    let siegePower = calculateRowPower(board.siege, activeWeather.siege);

    // Apply Class Advantage (Rock-Paper-Scissors)
    // +1 Power for each unit in the winning row if opponent has units in the losing row
    if (opponentBoard) {
        // Melee (Sword) > Ranged (Bow)
        if (opponentBoard.ranged.length > 0) {
            meleePower += board.melee.length; // +1 per Melee unit
        }
        // Ranged (Bow) > Siege (Catapult)
        if (opponentBoard.siege.length > 0) {
            rangedPower += board.ranged.length; // +1 per Ranged unit
        }
        // Siege (Catapult) > Melee (Sword)
        if (opponentBoard.melee.length > 0) {
            siegePower += board.siege.length; // +1 per Siege unit
        }
    }

    return meleePower + rangedPower + siegePower;
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
    boost: (context: AbilityContext): void => {
        const { state, card, player, targetRow } = context;
        if (!targetRow || !card.abilities[0]?.value) return;

        const playerState = player === 'player' ? state.player : state.ai;
        const rowCards = playerState.board[targetRow];
        const cardIndex = rowCards.findIndex(c => c.id === card.id);

        // Boost adjacent cards
        const boostValue = card.abilities[0].value;
        if (cardIndex > 0) {
            rowCards[cardIndex - 1].power = (rowCards[cardIndex - 1].power || 0) + boostValue;
        }
        if (cardIndex < rowCards.length - 1) {
            rowCards[cardIndex + 1].power = (rowCards[cardIndex + 1].power || 0) + boostValue;
        }
    },

    // Tight bond - double power when next to same name
    bond: (context: AbilityContext): void => {
        const { state, card, player, targetRow } = context;
        if (!targetRow) return;

        const playerState = player === 'player' ? state.player : state.ai;
        const rowCards = playerState.board[targetRow];
        const sameNameCards = rowCards.filter(c => c.name === card.name);

        // Double all cards with same name if there are multiples
        if (sameNameCards.length > 1) {
            sameNameCards.forEach(c => {
                c.power = (c.power || 0) * 2;
            });
        }
    },

    // Spy - give card to enemy, draw cards
    spy: (context: AbilityContext): void => {
        const { state, card, player, targetRow } = context;
        if (!targetRow) return;

        const drawCount = card.abilities[0]?.value || 2;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const enemyPlayer = player === 'player' ? 'ai' : 'player';

        // Card goes to enemy row
        state[enemyPlayer].board[targetRow].push(card);

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
    revive: (context: AbilityContext): void => {
        const { state, player, targetRow } = context;
        if (!targetRow) return;

        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const graveyard = state[currentPlayer].graveyard;

        // Find first unit in graveyard
        const unitIndex = graveyard.findIndex(c => c.type === 'unit');
        if (unitIndex !== -1) {
            const revived = graveyard.splice(unitIndex, 1)[0];
            if (revived.row) {
                state[currentPlayer].board[revived.row].push(revived);
            }
        }
    },

    // Destroy strongest units
    destroy: (context: AbilityContext): void => {
        const { state, card } = context;

        // Find highest power across all rows
        const allUnits: { card: Card; owner: PlayerType; row: RowType }[] = [];

        (['melee', 'ranged', 'siege'] as RowType[]).forEach(row => {
            state.player.board[row].forEach(c =>
                allUnits.push({ card: c, owner: 'player', row }));
            state.ai.board[row].forEach(c =>
                allUnits.push({ card: c, owner: 'ai', row }));
        });

        if (allUnits.length === 0) return;

        // Filter out the card acting (so Dragon Hunter doesn't kill himself)
        const otherUnits = allUnits.filter(u => u.card.id !== card.id);

        if (otherUnits.length === 0) return;

        const maxPower = Math.max(...otherUnits.map(u => u.card.power || 0));
        const unitsToDestroy = otherUnits.filter(u => u.card.power === maxPower);

        // Destroy all units with max power
        unitsToDestroy.forEach(({ card: targetCard, owner, row }) => {
            const board = state[owner].board[row];
            const index = board.findIndex(c => c.id === targetCard.id);
            if (index !== -1) {
                const [removed] = board.splice(index, 1);
                state[owner].graveyard.push(removed);
            }
        });
    },

    // Commander's Horn - double row power
    boost_row: (context: AbilityContext): void => {
        const { state, player, targetRow } = context;
        if (!targetRow) return;

        const currentPlayer = player === 'player' ? 'player' : 'ai';
        state[currentPlayer].board[targetRow].forEach(card => {
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

    // Rally - boost all friendly units
    boost_all: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const boostValue = card.abilities[0]?.value || 1;
        const currentPlayer = player === 'player' ? 'player' : 'ai';
        const board = state[currentPlayer].board;

        (['melee', 'ranged', 'siege'] as RowType[]).forEach(row => {
            board[row].forEach(c => {
                c.power = (c.power || 0) + boostValue;
            });
        });
    },

    // Dark Command - damage strongest enemy
    damage_strongest: (context: AbilityContext): void => {
        const { state, player, card } = context;
        const damageValue = card.abilities[0]?.value || 2;
        const enemyPlayer = player === 'player' ? 'ai' : 'player';

        const allEnemyUnits: { card: Card; row: RowType }[] = [];

        (['melee', 'ranged', 'siege'] as RowType[]).forEach(row => {
            state[enemyPlayer].board[row].forEach(c =>
                allEnemyUnits.push({ card: c, row }));
        });

        if (allEnemyUnits.length === 0) return;

        const maxPower = Math.max(...allEnemyUnits.map(u => u.card.power || 0));
        const targets = allEnemyUnits.filter(u => u.card.power === maxPower);

        // Damage all tied strongest units (or just one? "Deal 2 damage to A unit" implies single target. Scorch affects all.
        // Let's affect all tied units for simplicity/fairness or just the first.
        // If "Deal 2 damage to a unit", usually targeted.
        // If I make it "Damage strongest enemy", usually affects one. 
        // I'll damage the first one found to simulate single target auto-cast.
        if (targets.length > 0) {
            const target = targets[0];
            target.card.power = (target.card.power || 0) - damageValue;

            // Check death
            if (target.card.power <= 0) {
                const board = state[enemyPlayer].board[target.row];
                const idx = board.findIndex(c => c.id === target.card.id);
                if (idx !== -1) {
                    const [dead] = board.splice(idx, 1);
                    state[enemyPlayer].graveyard.push(dead);
                }
            }
        }
    },
};

// Execute an ability
export const executeAbility = (
    ability: { type: string },
    context: AbilityContext
): void => {
    const effect = abilityEffects[ability.type as keyof typeof abilityEffects];
    if (effect) {
        effect(context);
    }
};
