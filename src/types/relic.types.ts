import { GameEventType } from '../engine/eventBus';
import { EffectGraph } from './card.types';

export type RelicRarity = 'common' | 'rare' | 'boss';

export interface Relic {
    id: string;
    name: string;
    description: string;
    icon: string; // React Native Vector Icons identifier
    rarity: RelicRarity;
    trigger: GameEventType;
    effect: EffectGraph;
    isActive: boolean;
}
