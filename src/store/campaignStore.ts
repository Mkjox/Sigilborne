import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NodeRewards } from '../data/campaignData';
import { CardRarity, Card } from '../types/card.types';
import * as Rules from '../engine/rules';
import { getAllCards } from '../data/cardData';
import { getRelicById } from '../data/relicData';

export interface ShopItem {
    id: string;
    type: 'card' | 'relic' | 'service';
    itemId: string; // The Card ID or Relic ID
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
    
    // Actions
    advanceToNode: (nodeId: number) => void;
    completeNode: (rewards?: NodeRewards) => void;
    addRelic: (relicId: string) => void;
    resetRun: () => void;
    
    // Shop Actions
    generateShopStock: () => void;
    buyItem: (shopItemId: string) => { success: boolean, message: string };
    removeCardFromDeck: (cardId: string) => { success: boolean, message: string };

    // Talent Actions
    unlockTalent: (talentId: string) => { success: boolean, message: string };
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
                    const newCompletedNodes = [...state.completedNodes, state.currentNodeId];
                    
                    // Award talent point every 5 nodes
                    let newPoints = state.talentPoints;
                    if (newCompletedNodes.length % 5 === 0) {
                        newPoints += 1;
                    }
                    
                    return {
                        completedNodes: newCompletedNodes,
                        gold: newGold,
                        talentPoints: newPoints,
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
                }),

            generateShopStock: () =>
                set((state) => {
                    const allCards = getAllCards();
                    const stock: ShopItem[] = [];

                    // 1. Pick 3 random cards
                    for (let i = 0; i < 3; i++) {
                        const card = allCards[Math.floor(Math.random() * allCards.length)];
                        let price = Rules.PRICE_COMMON;
                        if (card.rarity === 'rare') price = Rules.PRICE_RARE;
                        else if (card.rarity === 'epic') price = Rules.PRICE_EPIC;
                        else if (card.rarity === 'legendary') price = Rules.PRICE_LEGENDARY;

                        stock.push({
                            id: `shop_card_${i}_${Date.now()}`,
                            type: 'card',
                            itemId: card.id,
                            name: card.name,
                            price,
                            description: card.description,
                            rarity: card.rarity,
                            purchased: false,
                        });
                    }

                    // 2. Pick 1 random relic (hardcoded for now, or use a list)
                    const relicId = 'relic_war_banner'; // Example
                    const relic = getRelicById(relicId);
                    if (relic) {
                        stock.push({
                            id: `shop_relic_${Date.now()}`,
                            type: 'relic',
                            itemId: relic.id,
                            name: relic.name,
                            price: Rules.PRICE_RELIC,
                            description: relic.description,
                            purchased: false,
                        });
                    }

                    // 3. Add removal service
                    stock.push({
                        id: 'shop_service_remove',
                        type: 'service',
                        itemId: 'remove_card',
                        name: 'Deck Thinning',
                        price: Rules.PRICE_REMOVE_CARD,
                        description: 'Remove one card from your deck permanently.',
                        purchased: false,
                    });

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
                    
                    // Card purchases would need to be added to deckStore, 
                    // which is a separate store. We might need to handle this 
                    // via a cross-store action or a component-level trigger.
                    // For now, we'll just track the purchase in shopStock.

                    return {
                        gold: state.gold - item.price,
                        shopStock: newStock,
                        relics: newRelics,
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
            }
        }),
        {
            name: 'sigilborne-campaign-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
