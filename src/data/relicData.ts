import { Relic } from '../types';

export const AVAILABLE_RELICS: Relic[] = [
    {
        id: 'war_banner',
        name: 'War Banner',
        description: 'At the start of your turn, boost a random ally by 1.',
        icon: 'flag-variant', // MaterialCommunityIcons
        rarity: 'common',
        trigger: 'TURN_STARTED',
        isActive: true,
        effect: {
            trigger: 'passive',
            target: { type: 'random_ally' },
            operation: { type: 'boost', value: 1 }
        }
    },
    {
        id: 'mana_crystal',
        name: 'Mana Crystal',
        description: 'At the start of each round, gain 1 Max Mana.',
        icon: 'crystal',
        rarity: 'rare',
        trigger: 'ROUND_STARTED',
        isActive: true,
        effect: {
            trigger: 'passive',
            target: { type: 'self' }, // For Mana/Health, 'self' just means the triggering player's state
            operation: { type: 'boost', value: 1 } // We'll need a specific 'max_mana' operation type, or handle in EventBus subscriber
        }
    },
    {
        id: 'soul_gem',
        name: 'Soul Gem',
        description: 'When an ally is destroyed, draw 1 card.',
        icon: 'diamond',
        rarity: 'boss',
        trigger: 'CARD_DESTROYED',
        isActive: true,
        effect: {
            trigger: 'passive',
            target: { type: 'self' },
            operation: { type: 'draw', value: 1 }
        }
    },
    {
        id: 'thornmail',
        name: 'Thornmail',
        description: 'When an ally is damaged, deal 1 damage to a random enemy.',
        icon: 'shield-sun',
        rarity: 'common',
        trigger: 'UNIT_DAMAGED',
        isActive: true,
        effect: {
            trigger: 'passive',
            target: { type: 'random_enemy' },
            operation: { type: 'damage', value: 1 }
        }
    }
];

export const getRelicById = (id: string): Relic | undefined => {
    return AVAILABLE_RELICS.find(r => r.id === id);
};
