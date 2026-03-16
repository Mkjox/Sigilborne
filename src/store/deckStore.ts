import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../types';
import { getAllCards } from '../data/cardData';

// Helper to create unique IDs
const createId = () => Math.random().toString(36).substring(2, 11);

export interface Deck {
    id: string;
    name: string;
    heroId: string;
    cards: Card[];
    createdAt: number;
}

interface DeckStore {
    decks: Deck[];
    activeDeckId: string | null;

    // Actions
    createDeck: (name: string) => string;
    deleteDeck: (deckId: string) => void;
    renameDeck: (deckId: string, name: string) => void;
    setDeckHero: (deckId: string, heroId: string) => void;
    addCardToDeck: (deckId: string, card: Card) => void;
    removeCardFromDeck: (deckId: string, cardId: string) => void;
    setActiveDeck: (deckId: string | null) => void;
    getActiveDeck: () => Deck | null;
    getDeckCards: (deckId: string) => Card[];
}

export const useDeckStore = create<DeckStore>()(
    persist(
        (set, get) => ({
            decks: [],
            activeDeckId: null,

            createDeck: (name: string) => {
                const newDeck: Deck = {
                    id: createId(),
                    name,
                    heroId: 'hero_commander', // Default hero
                    cards: [],
                    createdAt: Date.now(),
                };
                set(state => ({ decks: [...state.decks, newDeck] }));
                return newDeck.id;
            },

            deleteDeck: (deckId: string) => {
                set(state => ({
                    decks: state.decks.filter(d => d.id !== deckId),
                    activeDeckId: state.activeDeckId === deckId ? null : state.activeDeckId,
                }));
            },

            renameDeck: (deckId: string, name: string) => {
                set(state => ({
                    decks: state.decks.map(d => d.id === deckId ? { ...d, name } : d),
                }));
            },

            setDeckHero: (deckId: string, heroId: string) => {
                set(state => ({
                    decks: state.decks.map(d => d.id === deckId ? { ...d, heroId } : d),
                }));
            },

            addCardToDeck: (deckId: string, card: Card) => {
                set(state => ({
                    decks: state.decks.map(d => {
                        if (d.id !== deckId) return d;
                        // Max 25 cards, max 2 copies of same card
                        if (d.cards.length >= 25) return d;
                        const copies = d.cards.filter(c => c.name === card.name).length;
                        if (copies >= 2) return d;
                        return { ...d, cards: [...d.cards, { ...card, id: createId() }] };
                    }),
                }));
            },

            removeCardFromDeck: (deckId: string, cardId: string) => {
                set(state => ({
                    decks: state.decks.map(d => {
                        if (d.id !== deckId) return d;
                        return { ...d, cards: d.cards.filter(c => c.id !== cardId) };
                    }),
                }));
            },

            setActiveDeck: (deckId: string | null) => {
                set({ activeDeckId: deckId });
            },

            getActiveDeck: () => {
                const { decks, activeDeckId } = get();
                return decks.find(d => d.id === activeDeckId) || null;
            },

            getDeckCards: (deckId: string) => {
                const deck = get().decks.find(d => d.id === deckId);
                return deck?.cards || [];
            },
        }),
        {
            name: 'deck-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
