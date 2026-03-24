import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NodeRewards } from '../data/campaignData';

export interface CampaignStore {
    currentNodeId: number;
    completedNodes: number[];
    gold: number;
    relics: string[]; // IDs of acquired relics
    runSeed: number; // For future deterministic generation if needed
    
    // Actions
    advanceToNode: (nodeId: number) => void;
    completeNode: (rewards?: NodeRewards) => void;
    addRelic: (relicId: string) => void;
    resetRun: () => void;
}

export const useCampaignStore = create<CampaignStore>()(
    persist(
        (set) => ({
            currentNodeId: 1, // Start at node 1
            completedNodes: [],
            gold: 0,
            relics: [],
            runSeed: Date.now(),

            advanceToNode: (nodeId) =>
                set((state) => {
                    // Quick validation - normally we'd check if nodeId is in connections
                    // But for simple store just set it
                    return { currentNodeId: nodeId };
                }),

            completeNode: (rewards) =>
                set((state) => {
                    if (state.completedNodes.includes(state.currentNodeId)) {
                        return state; // Already complete
                    }
                    
                    const newGold = state.gold + (rewards?.gold || 0);
                    // Cards and relics would be handled here or in their respective stores
                    
                    return {
                        completedNodes: [...state.completedNodes, state.currentNodeId],
                        gold: newGold,
                    };
                }),

            addRelic: (relicId) =>
                set((state) => {
                    if (state.relics.includes(relicId)) return state;
                    return { relics: [...state.relics, relicId] };
                }),

            resetRun: () =>
                set({
                    currentNodeId: 1,
                    completedNodes: [],
                    gold: 0,
                    relics: [],
                    runSeed: Date.now(),
                }),
        }),
        {
            name: 'sigilborne-campaign-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
