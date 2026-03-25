import { Difficulty } from './game.types';

// Navigation types for React Navigation
export type RootStackParamList = {
    MainMenu: undefined;
    CampaignMap: undefined;
    GameBoard: { difficulty: Difficulty; stageId?: number };
    DeckBuilder: undefined;
    Collection: undefined;
    Settings: undefined;
    Shop: undefined;
    TalentTree: undefined;
    Victory: { rewards: any }; // Will be properly typed in Phase 8
    Defeat: undefined;
};
