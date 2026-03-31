import { getTotalPower, playCard, resolveRound, createInitialGameState } from '../gameEngine';
import { Card, GameState } from '../../types';

describe('Game Engine', () => {
    let initialState: GameState;

    beforeEach(() => {
        // Mock card data might be needed if createInitialGameState fails
        initialState = createInitialGameState();
    });

    test('getTotalPower should correctly sum card power', () => {
        const board: Card[] = [
            { id: '1', name: 'Unit 1', type: 'unit', power: 5, attack: 2, abilities: [] } as any,
            { id: '2', name: 'Unit 2', type: 'unit', power: 3, attack: 1, abilities: [] } as any,
        ];
        const weather = { melee: false, ranged: false, siege: false };
        const power = getTotalPower(board, weather);
        expect(power).toBe(8);
    });

    test('playCard should deduct mana and move card to board', () => {
        const card: Card = { 
            id: 'test-card', 
            name: 'Test', 
            type: 'unit', 
            manaCost: 2, 
            power: 4, 
            attack: 2, 
            abilities: [] 
        } as any;
        
        initialState.player.hand = [card];
        initialState.player.mana = 10;
        initialState.currentTurn = 'player';

        const { newState, success } = playCard(initialState, 'test-card', initialState.weather);

        expect(success).toBe(true);
        expect(newState.player.mana).toBe(8);
        expect(newState.player.hand).toHaveLength(0);
        expect(newState.player.board).toHaveLength(1);
        expect(newState.player.board[0].id).toBe('test-card');
    });

    test('resolveRound should correctly determine the winner', () => {
        initialState.player.board = [{ id: 'p1', power: 10, abilities: [] } as any];
        initialState.ai.board = [{ id: 'a1', power: 5, abilities: [] } as any];
        initialState.player.health = 2;
        initialState.ai.health = 2;

        const resolvedState = resolveRound(initialState);

        expect(resolvedState.roundsWon.player).toBe(1);
        expect(resolvedState.ai.health).toBe(1);
        expect(resolvedState.roundHistory).toHaveLength(1);
        expect(resolvedState.roundHistory[0].playerScore).toBe(10);
        expect(resolvedState.roundHistory[0].aiScore).toBe(5);
    });
});
