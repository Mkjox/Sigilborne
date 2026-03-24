/**
 * eventBus.ts — Lightweight pub/sub system for decoupling game events.
 *
 * WHY: Direct mutation in ability handlers and engine functions creates tight
 * coupling between systems. The EventBus lets relics, passive abilities, AI,
 * and VFX all react to game events independently without each knowing about
 * the others. It also provides a replayable event log for debugging.
 */

// ─── Event Types ────────────────────────────────────────────────
export type GameEventType =
    | 'CARD_PLAYED'
    | 'CARD_DESTROYED'
    | 'UNIT_DAMAGED'
    | 'UNIT_HEALED'
    | 'UNIT_BOOSTED'
    | 'TURN_STARTED'
    | 'TURN_ENDED'
    | 'ROUND_STARTED'
    | 'ROUND_ENDED'
    | 'ABILITY_TRIGGERED'
    | 'HERO_ABILITY_USED'
    | 'GAME_OVER'
    | 'CARD_DRAWN'
    | 'PLAYER_PASSED';

export interface GameEvent {
    type: GameEventType;
    payload: Record<string, any>;
    timestamp: number;
}

export type EventHandler = (event: GameEvent) => void;

// ─── EventBus Class ─────────────────────────────────────────────
export class EventBus {
    private listeners: Map<GameEventType, EventHandler[]> = new Map();
    private eventLog: GameEvent[] = [];
    private maxLogSize: number;

    constructor(maxLogSize: number = 200) {
        this.maxLogSize = maxLogSize;
    }

    /**
     * Subscribe to a specific event type.
     * Returns an unsubscribe function for cleanup.
     */
    subscribe(type: GameEventType, handler: EventHandler): () => void {
        const handlers = this.listeners.get(type) || [];
        handlers.push(handler);
        this.listeners.set(type, handlers);

        // Return unsubscribe function
        return () => {
            const current = this.listeners.get(type) || [];
            this.listeners.set(
                type,
                current.filter(h => h !== handler)
            );
        };
    }

    /**
     * Emit an event to all subscribers of that type.
     * Events are also recorded in the log for debugging/replay.
     */
    emit(type: GameEventType, payload: Record<string, any> = {}): void {
        const event: GameEvent = {
            type,
            payload,
            timestamp: Date.now(),
        };

        // Record event
        this.eventLog.push(event);
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog.shift(); // FIFO trim
        }

        // Notify all handlers
        const handlers = this.listeners.get(type) || [];
        handlers.forEach(handler => {
            try {
                handler(event);
            } catch (err) {
                console.warn(`[EventBus] Handler error for ${type}:`, err);
            }
        });
    }

    /**
     * Remove all listeners and clear the log.
     * Call this when starting a new game.
     */
    clear(): void {
        this.listeners.clear();
        this.eventLog = [];
    }

    /**
     * Get the full event log for debugging or replay.
     */
    getLog(): GameEvent[] {
        return [...this.eventLog];
    }

    /**
     * Get events of a specific type from the log.
     */
    getEventsOfType(type: GameEventType): GameEvent[] {
        return this.eventLog.filter(e => e.type === type);
    }
}

// ─── Global Singleton ───────────────────────────────────────────
// The store creates and owns the instance, but we provide a default
// for engine-level usage during testing or standalone calls.
let _globalBus: EventBus | null = null;

export const getGlobalEventBus = (): EventBus => {
    if (!_globalBus) {
        _globalBus = new EventBus();
    }
    return _globalBus;
};

export const resetGlobalEventBus = (): void => {
    if (_globalBus) {
        _globalBus.clear();
    }
    _globalBus = new EventBus();
};
