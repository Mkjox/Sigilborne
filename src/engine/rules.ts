/**
 * rules.ts — Single source of truth for all game constants and rule definitions.
 *
 * WHY: Centralizing constants prevents logic drift between engine, store, and UI.
 * Every numeric rule lives here so that changing a value (e.g. hand size, mana)
 * propagates automatically without hunting through multiple files.
 */

// ─── Board & Hand ───────────────────────────────────────────────
export const STARTING_HAND_SIZE = 5;
export const MAX_HAND_SIZE = 10;
export const MAX_BOARD_SIZE = 9;
export const DRAW_PER_ROUND = 2;

// ─── Round System ───────────────────────────────────────────────
export const MAX_ROUNDS = 3;
export const ROUNDS_TO_WIN = 2;
export const STARTING_HEALTH = 2; // "lives" for best-of-3

// ─── Resources ──────────────────────────────────────────────────
export const MANA_PER_ROUND = 10;

// ─── Deck Building ──────────────────────────────────────────────
export const MIN_DECK_SIZE = 10;
export const MAX_DECK_SIZE = 25;
export const MAX_COPIES_PER_CARD = 2;
export const MAX_LEGENDARIES_PER_DECK = 1;

// ─── Combat ─────────────────────────────────────────────────────
/** On a tied round both players lose a life (Gwent-style). */
export const TIE_BREAKER: 'both_lose' | 'defender_wins' = 'both_lose';

// ─── Abilities ──────────────────────────────────────────────────
export const BOND_MULTIPLIER = 2;
export const MAX_BOOST_STACK = 99; // Safety cap to prevent infinite loops

// ─── Faction ────────────────────────────────────────────────────
export const MAX_OFF_FACTION_CARDS = 5;
export const FACTION_SYNERGY_THRESHOLD = 3;
export const FACTION_SYNERGY_BOOST = 1;
// ─── Shop Prices ────────────────────────────────────────────────
export const PRICE_COMMON = 50;
export const PRICE_RARE = 120;
export const PRICE_EPIC = 250;
export const PRICE_LEGENDARY = 500;
export const PRICE_RELIC = 350;
export const PRICE_REMOVE_CARD = 100;
