import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NodeRewards } from '../data/campaignData';
import { CardRarity, Card, Difficulty } from '../types';
import * as Rules from '../engine/rules';
import { getAllCards } from '../data/cardData';
import { getRelicById } from '../data/relicData';

export interface ShopItem {
    id: string;
    type: 'card' | 'relic' | 'service' | 'faction_unlock';
    itemId: string; // The Card ID, Relic ID, or Faction name
    name: string;
    price: number;
    description: string;
    rarity?: CardRarity;
    purchased: boolean;
}

export interface CampaignStore {
    currentNodeId: number;
    completedNodes: number[];
    gold: number;
    relics: string[]; // IDs of acquired relics
    runSeed: number; // For future deterministic generation if needed
    shopStock: ShopItem[];
    talentPoints: number;
    unlockedTalentIds: string[];
    unlockedCardIds: string[]; // List of card IDs that have been "found/unlocked"
    runActive: boolean;
    
    // Actions
    advanceToNode: (nodeId: number) => void;
    completeNode: (nodeId: number, rewards?: NodeRewards, nextNodeIds?: number[]) => void;
    addRelic: (relicId: string) => void;
    resetRun: () => void;
    
    // Shop Actions
    generateShopStock: () => void;
    buyItem: (shopItemId: string) => { success: boolean, message: string };
    removeCardFromDeck: (cardId: string) => { success: boolean, message: string };
    setRunActive: (active: boolean) => void;

    // Talent Actions
    unlockCard: (cardId: string) => void;
    unlockTalent: (talentId: string) => { success: boolean, message: string };
    
    // Settings
    difficulty: Difficulty;
    setDifficulty: (difficulty: Difficulty) => void;
}

export const useCampaignStore = create<CampaignStore>()(
    persist(
        (set) => ({
            currentNodeId: 1, // Start at node 1
            completedNodes: [],
            gold: 150, // Start with some gold for testing the shop
            relics: [],
            runSeed: Date.now(),
            shopStock: [],
            talentPoints: 0,
            unlockedTalentIds: [],
            unlockedCardIds: [],
            difficulty: 'medium',
            runActive: false,
            
            setDifficulty: (difficulty) => set({ difficulty }),

            advanceToNode: (nodeId) =>
                set((state) => {
                    // Quick validation - normally we'd check if nodeId is in connections
                    // But for simple store just set it
                    return { currentNodeId: nodeId, runActive: true };
                }),

            completeNode: (nodeId, rewards, nextNodeIds = []) =>
                set((state) => {
                    const alreadyCompleted = state.completedNodes.includes(nodeId);
                    
                    // Award rewards ONLY if not already completed
                    const newGold = alreadyCompleted ? state.gold : state.gold + (rewards?.gold || 0);
                    
                    const newCompletedNodes = alreadyCompleted 
                        ? state.completedNodes 
                        : [...state.completedNodes, nodeId];
                    
                    // Award talent point every 5 UNIQUE nodes
                    let newPoints = state.talentPoints;
                    if (!alreadyCompleted && newCompletedNodes.length % 5 === 0) {
                        newPoints += 1;
                    }

                    // Unlock next nodes if we completed the current furthest node
                    // or if the provided next nodes are further than current progress
                    let newCurrentNodeId = state.currentNodeId;
                    if (nextNodeIds.length > 0) {
                        const maxNext = Math.max(...nextNodeIds);
                        // Only advance if the next nodes are actually further than current
                        if (maxNext > state.currentNodeId) {
                            newCurrentNodeId = maxNext;
                        }
                    } else if (nodeId === state.currentNodeId) {
                        // Fallback: simple linear increment if no specific connections provided
                        newCurrentNodeId = state.currentNodeId + 1;
                    }
                    
                    return {
                        completedNodes: newCompletedNodes,
                        gold: newGold,
                        talentPoints: newPoints,
                        currentNodeId: newCurrentNodeId,
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
                    gold: 150,
                    relics: [],
                    runSeed: Date.now(),
                    shopStock: [],
                    talentPoints: 0,
                    unlockedTalentIds: [],
                    unlockedCardIds: [],
                    runActive: false,
                }),

            generateShopStock: () =>
                set((state) => {
                    const allCards = getAllCards();
                    const unlockedCardPool = allCards.filter(c => !c.isLocked || state.unlockedCardIds.includes(c.id));
                    const stock: ShopItem[] = [];

                    // 1. Generate Faction Unlocks for factions that have locked cards
                    const factions = ['order', 'shadow', 'nature', 'arcane', 'neutral'] as const;
                    const availableFactions = factions.filter(faction => 
                        allCards.some(c => c.faction === faction && c.isLocked && !state.unlockedCardIds.includes(c.id))
                    );

                    // Shuffle available factions
                    for (let i = availableFactions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [availableFactions[i], availableFactions[j]] = [availableFactions[j], availableFactions[i]];
                    }

                    // Pick up to 3 faction unlocks
                    const numUnlocks = Math.min(3, availableFactions.length);
                    for (let i = 0; i < numUnlocks; i++) {
                        const faction = availableFactions[i];
                        stock.push({
                            id: `shop_unlock_${faction}_${Date.now()}`,
                            type: 'faction_unlock',
                            itemId: faction,
                            name: `shop.unlock_${faction}`,
                            price: Rules.PRICE_FACTION_UNLOCK,
                            description: `shop.unlock_${faction}_desc`,
                            purchased: false,
                        });
                    }

                    // 2. Add 2 random RELICS
                    const potentialRelics = ['war_banner', 'mana_crystal']; // We can expand this list later
                    for (let i = 0; i < 2; i++) {
                        const relicId = potentialRelics[i % potentialRelics.length];
                        const relic = getRelicById(relicId);
                        if (relic) {
                            stock.push({
                                id: `shop_relic_${i}_${Date.now()}`,
                                type: 'relic',
                                itemId: relic.id,
                                name: relic.name,
                                price: Rules.PRICE_RELIC,
                                description: relic.description,
                                purchased: false,
                            });
                        }
                    }

                    return { shopStock: stock };
                }),

            buyItem: (shopItemId) => {
                let success = false;
                let message = 'Item not found';
                
                set((state) => {
                    const itemIndex = state.shopStock.findIndex(i => i.id === shopItemId);
                    if (itemIndex === -1) return state;

                    const item = state.shopStock[itemIndex];
                    if (item.purchased) {
                        message = 'Already purchased';
                        return state;
                    }

                    if (state.gold < item.price) {
                        message = 'Not enough gold';
                        return state;
                    }

                    // Success!
                    success = true;
                    message = `Purchased ${item.name}`;
                    
                    const newStock = [...state.shopStock];
                    newStock[itemIndex] = { ...item, purchased: true };

                    // Add to inventory/relics/deck
                    let newRelics = state.relics;
                    if (item.type === 'relic') {
                        newRelics = [...state.relics, item.itemId];
                    }
                    
                    // Handle Faction Unlock
                    let newUnlockedCardIds = state.unlockedCardIds;
                    if (item.type === 'faction_unlock') {
                        const allCards = getAllCards();
                        const lockedFactionCards = allCards.filter(c => c.faction === item.itemId && c.isLocked && !state.unlockedCardIds.includes(c.id));
                        if (lockedFactionCards.length > 0) {
                            const randomCard = lockedFactionCards[Math.floor(Math.random() * lockedFactionCards.length)];
                            newUnlockedCardIds = [...state.unlockedCardIds, randomCard.id];
                        }
                    }

                    return {
                        gold: state.gold - item.price,
                        shopStock: newStock,
                        relics: newRelics,
                        unlockedCardIds: newUnlockedCardIds,
                    };
                });
                
                return { success, message };
            },

            removeCardFromDeck: (cardId) => {
                let success = false;
                let message = 'Not enough gold';
                
                set((state) => {
                    if (state.gold < Rules.PRICE_REMOVE_CARD) return state;
                    
                    success = true;
                    message = 'Card removed from deck';
                    return { gold: state.gold - Rules.PRICE_REMOVE_CARD };
                });

                return { success, message };
            },

            unlockCard: (cardId) =>
                set((state) => {
                    if (state.unlockedCardIds.includes(cardId)) return state;
                    return { unlockedCardIds: [...state.unlockedCardIds, cardId] };
                }),

            unlockTalent: (talentId) => {
                let success = false;
                let message = 'Not enough talent points';

                set((state) => {
                    if (state.talentPoints < 1) return state;
                    if (state.unlockedTalentIds.includes(talentId)) {
                        message = 'Already unlocked';
                        return state;
                    }

                    success = true;
                    message = 'Talent unlocked!';
                    return {
                        talentPoints: state.talentPoints - 1,
                        unlockedTalentIds: [...state.unlockedTalentIds, talentId],
                    };
                });

                return { success, message };
            },
            setRunActive: (active) => set({ runActive: active }),
        }),
        {
            name: 'sigilborne-campaign-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
