import { Card, CardType, CardRarity, Ability, Faction } from '../types';
import { Hero } from '../types/hero.types';

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
    createCard('Swordsman', 'unit', 'common', 1, 3, [], 'A basic infantry soldier', 'The first line of defense.', require('../../assets/units/swordsman.jpg')),
    createCard('Knight', 'unit', 'common', 2, 5, [], 'Armored cavalry unit', 'For honor and glory!', require('../../assets/units/knight.jpg')),
    createCard('Berserker', 'unit', 'rare', 3, 7, [ABILITIES.MORALE_BOOST(1)], 'Fierce warrior that inspires allies', 'His rage is legendary.', require('../../assets/units/berserker.jpg')),
    createCard('Shield Captain', 'unit', 'rare', 3, 4, [ABILITIES.TIGHT_BOND()], 'Stronger with fellow captains', 'Unity is strength.', require('../../assets/units/shield_captain.jpg')),
    createCard('Champion', 'unit', 'epic', 4, 9, [], 'Elite warrior of the realm', 'Undefeated in single combat.', require('../../assets/units/champion.jpg')),
    createCard('Warlord', 'unit', 'legendary', 6, 12, [ABILITIES.MORALE_BOOST(2)], 'Commands respect on the battlefield', 'All bow before the warlord.', require('../../assets/heroes/hero_commander.jpg')),
    // Sinister Expansion
    createCard('Lich King', 'unit', 'legendary', 10, 12, [ABILITIES.MORALE_BOOST(2)], 'Lord of the frozen dead', 'Death is but a new beginning.', require('../../assets/units/lich_king.jpg')),
    createCard('Grave Ghoul', 'unit', 'common', 1, 3, [], 'Feasts on the remains of battle', 'Always hungry.', require('../../assets/units/grave_ghoul.jpg')),
    createCard('Wight', 'unit', 'rare', 3, 5, [ABILITIES.TIGHT_BOND()], 'Ancient spirits bound to armor', 'They remember nothing but hate.', require('../../assets/units/wight.jpg')),
    createCard('Skeleton Warrior', 'unit', 'common', 1, 2, [ABILITIES.MUSTER('Skeleton Warrior')], 'Clattering bones that never tire', 'Rise and walk.', require('../../assets/units/skeleton_warrior.jpg')),
    createCard('Death Knight', 'unit', 'epic', 5, 10, [], 'A fallen hero serving the void', 'Honor died long ago.', require('../../assets/units/death_knight.jpg')),
    createCard('Zombie Horde', 'unit', 'common', 2, 1, [ABILITIES.MUSTER('Zombie Horde')], 'They keep coming...', 'Strength in numbers.', require('../../assets/units/zombie_horde.jpg')),
    createCard('Crypt Guard', 'unit', 'rare', 3, 6, [], 'Eternal protectors of the tomb', 'None shall pass.', require('../../assets/units/crypt_guard.jpg')),
].map((c, i) => ({ ...c, faction: (i < 6 ? 'order' : 'shadow') as Faction }));

// Ranged Units
export const RANGED_UNITS: Card[] = [
    createCard('Archer', 'unit', 'common', 1, 2, [], 'Basic ranged attacker', 'Aim true.', require('../../assets/units/archer.jpg')),
    createCard('Crossbowman', 'unit', 'common', 2, 4, [], 'Powerful ranged unit', 'One bolt, one kill.', require('../../assets/units/crossbowman.jpg')),
    createCard('Elven Marksman', 'unit', 'rare', 3, 6, [ABILITIES.TIGHT_BOND()], 'Elven archer with deadly aim', 'Never misses.', require('../../assets/units/elven_marksman.jpg')),
    createCard('Scout', 'unit', 'rare', 2, 1, [ABILITIES.SPY(2)], 'Infiltrates enemy lines', 'Information is power.', require('../../assets/units/scout.jpg')),
    createCard('Sniper', 'unit', 'epic', 4, 8, [], 'Elite marksman', 'One shot is all it takes.', require('../../assets/units/sniper.jpg')),
    createCard('Dragon Hunter', 'unit', 'legendary', 5, 10, [ABILITIES.SCORCH()], 'Slayer of the mightiest beasts', 'Fear the hunter.', require('../../assets/units/dragon_hunter.jpg')),
    // Sinister Expansion
    createCard('Dark Elf Archer', 'unit', 'common', 1, 3, [], 'Deadly precision from the shadows', 'Two eyes, one target.', require('../../assets/units/dark_elf_archer.jpg')),
    createCard('Soul Harvester', 'unit', 'rare', 4, 3, [ABILITIES.SPY(2)], 'Reaps the essence of the living', 'Your soul is forfeit.', require('../../assets/units/soul_harvester.jpg')),
    createCard('Banshee', 'unit', 'epic', 4, 7, [ABILITIES.SCORCH()], 'Her scream is a death sentence', 'The last thing you hear.', require('../../assets/units/banshee.jpg')),
    createCard('Void Wizard', 'unit', 'rare', 3, 5, [ABILITIES.MORALE_BOOST(1)], 'Wielder of unstable dark energy', 'The void calls to us all.', require('../../assets/units/void_wizard.jpg')),
    createCard('Shadow Assassin', 'unit', 'epic', 4, 8, [], 'Master of the silent kill', 'Gone before the body hits the floor.', require('../../assets/units/shadow_assassin.jpg')),
    createCard('Necromancer', 'unit', 'legendary', 6, 6, [ABILITIES.MEDIC()], 'Conduit for the afterlife', 'The grave is merely a door.', require('../../assets/units/necromancer.jpg')),
    createCard('Dark Elf Matriarch', 'unit', 'rare', 5, 7, [], 'Leader of the obsidian spire', 'Power is the only currency.', require('../../assets/units/dark_elf_matriarch.jpg')),
].map((c, i) => ({ ...c, faction: (i < 6 ? 'order' : 'shadow') as Faction }));

// Siege Units
export const SIEGE_UNITS: Card[] = [
    createCard('Catapult', 'unit', 'common', 2, 4, [], 'Basic siege weapon', 'Rocks incoming!', require('../../assets/units/catapult.jpg')),
    createCard('Ballista', 'unit', 'common', 3, 6, [], 'Heavy siege weapon', 'Pierces any armor.', require('../../assets/units/ballista.jpg')),
    createCard('Trebuchet', 'unit', 'rare', 4, 8, [], 'Massive siege engine', 'Walls crumble before it.', require('../../assets/units/trebutchet.jpg')),
    createCard('War Elephant', 'unit', 'rare', 4, 6, [ABILITIES.TIGHT_BOND()], 'Armored beast of war', 'Unstoppable force.', require('../../assets/units/war_elephant.jpg')),
    createCard('Siege Tower', 'unit', 'epic', 5, 5, [ABILITIES.COMMANDER_HORN()], 'Mobile fortress', 'Brings victory closer.', require('../../assets/units/siege_tower.jpg')),
    createCard('Dragon', 'unit', 'legendary', 8, 15, [], 'The ultimate weapon', 'Fire and fury.', require('../../assets/units/dragon.jpg')),
    // Sinister Expansion
    createCard('Bone Catapult', 'unit', 'common', 2, 4, [], 'Siege engine made of remains', 'Fires more than just rocks.', require('../../assets/units/bone_catapult.jpg')),
    createCard('Plague Spreader', 'unit', 'rare', 4, 6, [], 'Infects the battlefield', 'Let the sickness take them.', require('../../assets/units/plague_spreader.jpg')),
    createCard('Abomination', 'unit', 'epic', 6, 12, [], 'Stitched together from titans', 'A masterpiece of gore.', require('../../assets/units/abomination.jpg')),
    createCard('Demon Prince', 'unit', 'legendary', 10, 15, [], 'Ruler of the burning planes', 'Kneel or burn.', require('../../assets/units/demon_prince.jpg')),
    createCard('Hellhound', 'unit', 'common', 2, 3, [ABILITIES.MUSTER('Hellhound')], 'Firespitting beast of the abyss', 'The jaws that bite.', require('../../assets/units/hellhound.jpg')),
    createCard('Gargoyle', 'unit', 'common', 3, 4, [], 'Stone turned flesh and malice', 'Watch the skies.', require('../../assets/units/gargoyle.jpg')),
    createCard('Cursed Ballista', 'unit', 'rare', 4, 7, [], 'Enchanted bolts of shadow', 'Pierce the soul.', require('../../assets/units/cursed_ballista.jpg')),
].map((c, i) => ({ ...c, faction: (i < 6 ? 'order' : 'shadow') as Faction }));

// ============ SPELL CARDS ============

export const SPELL_CARDS: Card[] = [
    createCard("Commander's Horn", 'spell', 'rare', 2, undefined, [ABILITIES.COMMANDER_HORN()], 'Double the power of a row', require('../../assets/units/commanders_horn.jpg')),
    createCard('Decoy', 'spell', 'common', 1, undefined, [], 'Return a unit to your hand', require('../../assets/units/decoy.jpg')),
    createCard('Scorch', 'spell', 'epic', 3, undefined, [ABILITIES.SCORCH()], 'Destroy the strongest units', require('../../assets/units/scorch.jpg')),
    createCard('Resurrection', 'spell', 'rare', 2, undefined, [ABILITIES.MEDIC()], 'Revive a unit from graveyard', require('../../assets/units/resurrection.jpg')),
    // Sinister Expansion
    createCard('Dark Pact', 'spell', 'rare', 2, undefined, [ABILITIES.MEDIC()], 'Sacrifice essence to revive a unit', require('../../assets/units/dark_pact.jpg')),
    createCard('Void Bolt', 'spell', 'epic', 3, undefined, [ABILITIES.SCORCH()], 'Obliterate the strongest units', require('../../assets/units/void_bolt.jpg')),
    createCard('Life Drain', 'spell', 'rare', 2, undefined, [ABILITIES.COMMANDER_HORN()], 'Siphon power to boost allies', require('../../assets/units/life_drain.jpg')),
    createCard('Raise Dead', 'spell', 'common', 2, undefined, [ABILITIES.MEDIC()], 'The dead obey their master.', require('../../assets/units/raise_dead.jpg')),
].map((c, i) => ({ ...c, faction: (i < 4 ? 'neutral' : 'shadow') as Faction }));

// ============ WEATHER CARDS ============

export const WEATHER_CARDS: Card[] = [
    createCard('Biting Frost', 'weather', 'common', 1, undefined, [ABILITIES.FROST()], 'Sets melee units to 1 power', require('../../assets/units/biting_frost.jpg')),
    createCard('Impenetrable Fog', 'weather', 'common', 1, undefined, [ABILITIES.FOG()], 'Sets ranged units to 1 power', require('../../assets/units/impenetrable_fog.jpg')),
    createCard('Clear Skies', 'weather', 'common', 0, undefined, [ABILITIES.CLEAR_WEATHER()], 'Removes all weather effects', require('../../assets/units/clear_skies.jpg')),
    // Sinister Expansion
    createCard('Corrupt Ground', 'weather', 'common', 1, undefined, [ABILITIES.FROST()], 'Melee units lose their resolve', require('../../assets/units/corrupt_ground.jpg')),
    createCard('Wailing Fog', 'weather', 'common', 1, undefined, [ABILITIES.FOG()], 'Ranged units lose their sight', require('../../assets/units/wailing_fog.jpg')),
].map((c, i) => ({ ...c, faction: (i < 3 ? 'neutral' : 'shadow') as Faction }));

// ============ HEROES ============

export const AVAILABLE_HEROES: Hero[] = [
    {
        id: 'hero_commander',
        name: 'Commander',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_rally',
            name: 'Rally',
            type: 'boost_all',
            trigger: 'activate',
            description: 'Boost all friendly units by +1 power',
            value: 1,
            cooldown: 3,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_commander.jpg'),
        className: 'Warrior',
        faction: 'order',
    },
    {
        id: 'hero_darklord',
        name: 'Dark Lord',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_dark_command',
            name: 'Dark Command',
            type: 'damage_strongest',
            trigger: 'activate',
            description: 'Deal 2 damage to the strongest enemy unit',
            value: 2,
            cooldown: 3,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_darklord.jpg'),
        className: 'Warlock',
        faction: 'shadow',
    },
    {
        id: 'hero_archmage',
        name: 'Archmage',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_arcane_blast',
            name: 'Arcane Blast',
            type: 'damage_all', // We will implement this in gameEngine
            trigger: 'activate',
            description: 'Deal 1 damage to all enemy units',
            value: 1,
            cooldown: 4,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_archmage.jpg'),
        className: 'Mage',
        faction: 'arcane',
    },
    {
        id: 'hero_ranger',
        name: 'Ranger',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_precision_strike',
            name: 'Precision Strike',
            type: 'destroy_weakest', // We will implement this in gameEngine
            trigger: 'activate',
            description: 'Destroy the weakest enemy unit',
            value: 1, // Doesn't use value, but for consistency
            cooldown: 4,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_ranger.jpg'),
        className: 'Hunter',
        faction: 'nature',
    },
    {
        id: 'hero_paladin',
        name: 'Paladin',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_divine_shield',
            name: 'Divine Light',
            type: 'heal',
            trigger: 'activate',
            description: 'Restore 2 health to your hero',
            value: 2,
            cooldown: 3,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_paladin.jpg'),
        className: 'Cleric',
        faction: 'order',
    },
    {
        id: 'hero_rogue',
        name: 'Trickster',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_quick_draw',
            name: 'Quick Dig',
            type: 'draw_card',
            trigger: 'activate',
            description: 'Draw a card',
            value: 1,
            cooldown: 4,
            currentCooldown: 0,
        },
        artwork: require('../../assets/units/champion.jpg'),
        className: 'Rogue',
        faction: 'neutral',
    },
    {
        id: 'hero_berserker',
        name: 'Berserker',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_bloodlust',
            name: 'Bloodlust',
            type: 'damage_random',
            trigger: 'activate',
            description: 'Deal 1 damage to a random enemy unit',
            value: 1,
            cooldown: 2,
            currentCooldown: 0,
        },
        artwork: require('../../assets/units/champion.jpg'),
        className: 'Fighter',
        faction: 'order',
    },
    {
        id: 'hero_druid',
        name: 'Druid',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_nature_growth',
            name: 'Wild Growth',
            type: 'boost_random',
            trigger: 'activate',
            description: 'Boost a random friendly unit by +2 power',
            value: 2,
            cooldown: 3,
            currentCooldown: 0,
        },
        artwork: require('../../assets/units/champion.jpg'),
        className: 'Shaman',
        faction: 'nature',
    }
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
