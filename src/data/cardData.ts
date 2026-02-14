import { Card, CardType, CardRarity, Ability } from '../types';

// Helper to create unique IDs
const createId = () => Math.random().toString(36).substring(2, 11);

// Ability definitions
export const ABILITIES = {
    MORALE_BOOST: (value: number): Ability => ({
        id: 'morale_boost',
        name: 'Morale Boost',
        type: 'boost',
        trigger: 'onPlay',
        value,
        description: `Boost adjacent units by ${value}`,
    }),
    TIGHT_BOND: (): Ability => ({
        id: 'tight_bond',
        name: 'Tight Bond',
        type: 'bond',
        trigger: 'passive',
        description: 'Double power when beside a unit with the same name',
    }),
    SPY: (drawCount: number): Ability => ({
        id: 'spy',
        name: 'Spy',
        type: 'spy',
        trigger: 'onPlay',
        value: drawCount,
        description: `Place on enemy board. Draw ${drawCount} cards`,
    }),
    MEDIC: (): Ability => ({
        id: 'medic',
        name: 'Medic',
        type: 'revive',
        trigger: 'onPlay',
        description: 'Revive a unit from your graveyard',
    }),
    SCORCH: (): Ability => ({
        id: 'scorch',
        name: 'Scorch',
        type: 'destroy',
        trigger: 'onPlay',
        description: 'Destroy the strongest unit(s) on the battlefield',
    }),
    MUSTER: (targetName: string): Ability => ({
        id: 'muster',
        name: 'Muster',
        type: 'summon',
        trigger: 'onPlay',
        description: `Play all copies of ${targetName} from your deck`,
    }),
    COMMANDER_HORN: (): Ability => ({
        id: 'commander_horn',
        name: "Commander's Horn",
        type: 'boost_row',
        trigger: 'onPlay',
        description: 'Double the power of adjacent units (simulated row effect)',
    }),
    FROST: (): Ability => ({
        id: 'frost',
        name: 'Biting Frost',
        type: 'weather',
        trigger: 'onPlay',
        description: 'Set all melee-type units to 1 power (Legacy)',
    }),
    FOG: (): Ability => ({
        id: 'fog',
        name: 'Impenetrable Fog',
        type: 'weather',
        trigger: 'onPlay',
        description: 'Set all ranged-type units to 1 power (Legacy)',
    }),
    CLEAR_WEATHER: (): Ability => ({
        id: 'clear_weather',
        name: 'Clear Weather',
        type: 'clear',
        trigger: 'onPlay',
        description: 'Remove all weather effects',
    }),
};

// Create a card helper
const createCard = (
    name: string,
    type: CardType,
    rarity: CardRarity,
    manaCost: number,
    power: number | undefined,
    abilities: Ability[],
    description: string,
    flavorText?: string,
    artwork: any = ''
): Card => ({
    id: createId(),
    name,
    type,
    rarity,
    manaCost,
    power: power || 0,
    basePower: power || 0,
    attack: power || 0,
    isExhausted: true, // Summoning sickness by default
    abilities,
    artwork,
    description,
    flavorText,
});

// ============ UNIT CARDS ============

// Melee Units
export const MELEE_UNITS: Card[] = [
    createCard('Swordsman', 'unit', 'common', 1, 3, [], 'A basic infantry soldier', 'The first line of defense.', require('../../assets/generated/unit_swordsman.jpg')),
    createCard('Knight', 'unit', 'common', 2, 5, [], 'Armored cavalry unit', 'For honor and glory!', require('../../assets/generated/unit_knight.jpg')),
    createCard('Berserker', 'unit', 'rare', 3, 7, [ABILITIES.MORALE_BOOST(1)], 'Fierce warrior that inspires allies', 'His rage is legendary.', require('../../assets/generated/unit_berserker.jpg')),
    createCard('Shield Captain', 'unit', 'rare', 3, 4, [ABILITIES.TIGHT_BOND()], 'Stronger with fellow captains', 'Unity is strength.', require('../../assets/generated/unit_shield_captain.jpg')),
    createCard('Champion', 'unit', 'epic', 4, 9, [], 'Elite warrior of the realm', 'Undefeated in single combat.'),
    createCard('Warlord', 'unit', 'legendary', 6, 12, [ABILITIES.MORALE_BOOST(2)], 'Commands respect on the battlefield', 'All bow before the warlord.'),
];

// Ranged Units
export const RANGED_UNITS: Card[] = [
    createCard('Archer', 'unit', 'common', 1, 2, [], 'Basic ranged attacker', 'Aim true.'),
    createCard('Crossbowman', 'unit', 'common', 2, 4, [], 'Powerful ranged unit', 'One bolt, one kill.'),
    createCard('Elven Marksman', 'unit', 'rare', 3, 6, [ABILITIES.TIGHT_BOND()], 'Elven archer with deadly aim', 'Never misses.'),
    createCard('Scout', 'unit', 'rare', 2, 1, [ABILITIES.SPY(2)], 'Infiltrates enemy lines', 'Information is power.'),
    createCard('Sniper', 'unit', 'epic', 4, 8, [], 'Elite marksman', 'One shot is all it takes.'),
    createCard('Dragon Hunter', 'unit', 'legendary', 5, 10, [ABILITIES.SCORCH()], 'Slayer of the mightiest beasts', 'Fear the hunter.'),
];

// Siege Units
export const SIEGE_UNITS: Card[] = [
    createCard('Catapult', 'unit', 'common', 2, 4, [], 'Basic siege weapon', 'Rocks incoming!'),
    createCard('Ballista', 'unit', 'common', 3, 6, [], 'Heavy siege weapon', 'Pierces any armor.'),
    createCard('Trebuchet', 'unit', 'rare', 4, 8, [], 'Massive siege engine', 'Walls crumble before it.'),
    createCard('War Elephant', 'unit', 'rare', 4, 6, [ABILITIES.TIGHT_BOND()], 'Armored beast of war', 'Unstoppable force.'),
    createCard('Siege Tower', 'unit', 'epic', 5, 5, [ABILITIES.COMMANDER_HORN()], 'Mobile fortress', 'Brings victory closer.'),
    createCard('Dragon', 'unit', 'legendary', 8, 15, [], 'The ultimate weapon', 'Fire and fury.'),
];

// ============ SPELL CARDS ============

export const SPELL_CARDS: Card[] = [
    createCard("Commander's Horn", 'spell', 'rare', 2, undefined, [ABILITIES.COMMANDER_HORN()], 'Double the power of a row'),
    createCard('Decoy', 'spell', 'common', 1, undefined, [], 'Return a unit to your hand'),
    createCard('Scorch', 'spell', 'epic', 3, undefined, [ABILITIES.SCORCH()], 'Destroy the strongest units'),
    createCard('Resurrection', 'spell', 'rare', 2, undefined, [ABILITIES.MEDIC()], 'Revive a unit from graveyard'),
];

// ============ WEATHER CARDS ============

export const WEATHER_CARDS: Card[] = [
    createCard('Biting Frost', 'weather', 'common', 1, undefined, [ABILITIES.FROST()], 'Sets melee units to 1 power'),
    createCard('Impenetrable Fog', 'weather', 'common', 1, undefined, [ABILITIES.FOG()], 'Sets ranged units to 1 power'),
    createCard('Clear Skies', 'weather', 'common', 0, undefined, [ABILITIES.CLEAR_WEATHER()], 'Removes all weather effects'),
];

// ============ STARTER DECKS ============

export const createStarterDeck = (): Card[] => {
    // Create fresh copies with unique IDs
    const deck: Card[] = [];

    // Add 2 copies of common units
    const addWithCopies = (cards: Card[], copies: number) => {
        cards.forEach(card => {
            for (let i = 0; i < copies; i++) {
                deck.push({ ...card, id: createId() });
            }
        });
    };

    // Commons: 2 copies each
    addWithCopies(MELEE_UNITS.filter(c => c.rarity === 'common'), 2);
    addWithCopies(RANGED_UNITS.filter(c => c.rarity === 'common'), 2);
    addWithCopies(SIEGE_UNITS.filter(c => c.rarity === 'common'), 2);

    // Rares: 1 copy each
    addWithCopies(MELEE_UNITS.filter(c => c.rarity === 'rare'), 1);
    addWithCopies(RANGED_UNITS.filter(c => c.rarity === 'rare'), 1);
    addWithCopies(SIEGE_UNITS.filter(c => c.rarity === 'rare'), 1);

    // Epics: 1 copy each
    addWithCopies(MELEE_UNITS.filter(c => c.rarity === 'epic'), 1);
    addWithCopies(RANGED_UNITS.filter(c => c.rarity === 'epic'), 1);
    addWithCopies(SIEGE_UNITS.filter(c => c.rarity === 'epic'), 1);

    // 1 Legendary
    addWithCopies([MELEE_UNITS.find(c => c.rarity === 'legendary')!], 1);

    // Spells and weather
    addWithCopies(SPELL_CARDS.slice(0, 2), 1);
    addWithCopies(WEATHER_CARDS.slice(0, 2), 1);

    return deck;
};

// Create AI deck (slightly different composition)
export const createAIDeck = (): Card[] => {
    const deck: Card[] = [];

    const addWithCopies = (cards: Card[], copies: number) => {
        cards.forEach(card => {
            for (let i = 0; i < copies; i++) {
                deck.push({ ...card, id: createId() });
            }
        });
    };

    // AI gets more aggressive units
    addWithCopies(MELEE_UNITS.filter(c => c.rarity === 'common'), 2);
    addWithCopies(RANGED_UNITS.filter(c => c.rarity === 'common'), 2);
    addWithCopies(SIEGE_UNITS.filter(c => c.rarity === 'common'), 2);
    addWithCopies(MELEE_UNITS.filter(c => c.rarity === 'rare'), 1);
    addWithCopies(RANGED_UNITS.filter(c => c.rarity === 'rare'), 1);
    addWithCopies(SIEGE_UNITS.filter(c => c.rarity === 'rare'), 1);
    addWithCopies(MELEE_UNITS.filter(c => c.rarity === 'epic'), 1);
    addWithCopies(RANGED_UNITS.filter(c => c.rarity === 'epic'), 1);
    addWithCopies([SIEGE_UNITS.find(c => c.rarity === 'legendary')!], 1);
    addWithCopies(WEATHER_CARDS.slice(0, 2), 1);

    return deck;
};

// Get all available cards for collection
export const getAllCards = (): Card[] => [
    ...MELEE_UNITS,
    ...RANGED_UNITS,
    ...SIEGE_UNITS,
    ...SPELL_CARDS,
    ...WEATHER_CARDS,
];
