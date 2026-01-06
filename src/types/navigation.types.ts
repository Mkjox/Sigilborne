import { Difficulty } from './game.types';

// Navigation types for React Navigation
export type RootStackParamList = {
    MainMenu: undefined;
    GameBoard: { difficulty: Difficulty };
    DeckBuilder: undefined;
    Collection: undefined;
    Settings: undefined;
    Victory: { rewards: any }; // Will be properly typed in Phase 8
    Defeat: undefined;
};
