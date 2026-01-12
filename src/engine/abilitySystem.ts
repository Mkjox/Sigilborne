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
export const calculateBoardPower = (board: BoardRow, activeWeather: { melee: boolean; ranged: boolean; siege: boolean }): number => {
    return (
        calculateRowPower(board.melee, activeWeather.melee) +
        calculateRowPower(board.ranged, activeWeather.ranged) +
        calculateRowPower(board.siege, activeWeather.siege)
    );
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
        const { state } = context;

        // Find highest power across all rows
        const allUnits: { card: Card; owner: PlayerType; row: RowType }[] = [];

        (['melee', 'ranged', 'siege'] as RowType[]).forEach(row => {
            state.player.board[row].forEach(card =>
                allUnits.push({ card, owner: 'player', row }));
            state.ai.board[row].forEach(card =>
                allUnits.push({ card, owner: 'ai', row }));
        });

        if (allUnits.length === 0) return;

        const maxPower = Math.max(...allUnits.map(u => u.card.power || 0));
        const unitsToDestroy = allUnits.filter(u => u.card.power === maxPower);

        // Destroy all units with max power
        unitsToDestroy.forEach(({ card, owner, row }) => {
            const board = state[owner].board[row];
            const index = board.findIndex(c => c.id === card.id);
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
