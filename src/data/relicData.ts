import { Relic } from '../types';

export const AVAILABLE_RELICS: Relic[] = [
    {
        id: 'war_banner',
        name: 'relics.war_banner.name',
        description: 'relics.war_banner.desc',
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
        name: 'relics.mana_crystal.name',
        description: 'relics.mana_crystal.desc',
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
        name: 'relics.soul_gem.name',
        description: 'relics.soul_gem.desc',
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
        name: 'relics.thornmail.name',
        description: 'relics.thornmail.desc',
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
