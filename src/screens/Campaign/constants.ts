import { colors } from '../../theme';

export const TOTAL_STAGES = 200;

export interface Stage {
    id: number;
    x: number;
    branch?: 'left' | 'right';
    connections: number[];
}

export const MAP_BIOMES = [
    { start: 0, end: 40, name: 'Verdant Echo', colors: [colors.arcane.emerald, '#064e3b'] },
    { start: 41, end: 80, name: 'Azure Spire', colors: [colors.arcane.cyan, '#0e7490'] },
    { start: 81, end: 120, name: 'Twilight Rift', colors: ['#a855f7', '#581c87'] },
    { start: 121, end: 160, name: 'Crimson Wake', colors: ['#ef4444', '#7f1d1d'] },
    { start: 161, end: 200, name: 'Obsidian Heart', colors: ['#4b5563', '#111827'] },
];
