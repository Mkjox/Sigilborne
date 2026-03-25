import { Stage, MapNodeType, TOTAL_STAGES } from '../screens/Campaign/constants';
import { Difficulty } from '../types';

export interface NodeRewards {
    cards?: string[];
    gold?: number;
    relicId?: string;
}

export interface MapNode extends Stage {
    rewards?: NodeRewards;
    difficulty?: Difficulty;
}

/**
 * Generate a deterministic campaign map layout with varied node types.
 * @param totalStages Number of stages to generate (default 200)
 */
export const generateCampaignMap = (totalStages: number = TOTAL_STAGES): MapNode[] => {
    const items: MapNode[] = [];
    
    // Generates the layout structure identical to the original UI logic
    for (let i = 1; i <= totalStages; i++) {
        const isBranchPoint = i % 15 === 0 && i < totalStages - 10;
        const basePos = 50 + (Math.sin(i * 0.5) * 22);
        
        if (isBranchPoint) {
            items.push({ id: i, type: 'battle', x: 50, connections: [i + 1, i + 2] });
            items.push({ id: i + 1, type: 'battle', x: 25, branch: 'left', connections: [i + 3] });
            items.push({ id: i + 2, type: 'battle', x: 75, branch: 'right', connections: [i + 3] });
            i += 2;
        } else {
            items.push({ id: i, type: 'battle', x: basePos, connections: i < totalStages ? [i + 1] : [] });
        }
    }

    // Now assign types based on logical rules
    items.forEach((node) => {
        // Bosses are every 20 stages (end of a biome partition)
        if (node.id % 20 === 0) {
            node.type = 'boss';
            node.difficulty = 'hard';
            node.rewards = { gold: 50, cards: [], relicId: 'random' }; // placeholder relic logic
            return;
        }

        // Event or Elite before Boss
        if (node.id % 20 === 19) {
            node.type = node.id % 40 === 19 ? 'rest' : 'event';
            return;
        }

        // Branch paths have Elite and Event choices
        if (node.branch === 'left') {
            node.type = 'elite';
            node.difficulty = 'hard';
            node.rewards = { gold: 20, cards: [] }; // Increased rewards
            return;
        }
        if (node.branch === 'right') {
            node.type = 'event';
            return;
        }

        // Randomly assign rest, shop, or event occasionally in the main path
        // Using node.id to make it deterministic but pseudorandom looking
        if (node.id % 7 === 0 && node.type === 'battle') {
            node.type = 'event';
        } else if (node.id % 13 === 0 && node.type === 'battle') {
            node.type = 'event';
        } else if (node.type === 'battle') {
            // Default battle rewards
            node.difficulty = node.id > 100 ? 'medium' : 'easy';
            node.rewards = { gold: 5 };
        }
    });

    return items;
};
