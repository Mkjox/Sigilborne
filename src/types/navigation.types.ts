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
    Event: { stageId: number };
    Lore: undefined;
    Tutorial: undefined;
    Victory: { rewards: any };
    Defeat: undefined;
};
