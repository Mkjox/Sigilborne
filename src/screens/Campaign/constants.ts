import { colors } from '../../theme';

export const TOTAL_STAGES = 200;

export type MapNodeType = 'battle' | 'elite' | 'boss' | 'shop' | 'event' | 'rest';

export interface Stage {
    id: number;
    type: MapNodeType;
    x: number;
    branch?: 'left' | 'right';
    connections: number[];
}

export const MAP_BIOMES = [
    { id: 'verdant_echo', start: 0, end: 40, name: 'Verdant Echo', colors: [colors.arcane.emerald, '#064e3b'] },
    { id: 'azure_spire', start: 41, end: 80, name: 'Azure Spire', colors: [colors.arcane.cyan, '#0e7490'] },
    { id: 'twilight_rift', start: 81, end: 120, name: 'Twilight Rift', colors: ['#a855f7', '#581c87'] },
    { id: 'crimson_wake', start: 121, end: 160, name: 'Crimson Wake', colors: ['#ef4444', '#7f1d1d'] },
    { id: 'obsidian_heart', start: 161, end: 200, name: 'Obsidian Heart', colors: ['#4b5563', '#111827'] },
];
