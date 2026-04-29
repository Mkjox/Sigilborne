import { Card, CardType, CardRarity, Ability, Faction } from '../types';
import { Hero, TalentTree } from '../types/hero.types';

// Helper to create unique IDs
const createId = () => Math.random().toString(36).substring(2, 11);

// Ability definitions
export const ABILITIES = {
    MORALE_BOOST: (value: number): Ability => ({
        id: 'morale_boost',
        name: 'abilities.morale_boost.name',
        type: 'boost',
        trigger: 'onPlay',
        value,
        description: 'abilities.morale_boost.desc',
    }),
    TIGHT_BOND: (): Ability => ({
        id: 'tight_bond',
        name: 'abilities.bond.name',
        type: 'bond',
        trigger: 'passive',
        description: 'abilities.bond.desc',
    }),
    SPY: (drawCount: number): Ability => ({
        id: 'spy',
        name: 'abilities.spy.name',
        type: 'spy',
        trigger: 'onPlay',
        value: drawCount,
        description: 'abilities.spy.desc',
    }),
    MEDIC: (): Ability => ({
        id: 'medic',
        name: 'abilities.medic.name',
        type: 'revive',
        trigger: 'onPlay',
        description: 'abilities.medic.desc',
    }),
    SCORCH: (): Ability => ({
        id: 'scorch',
        name: 'abilities.scorch.name',
        type: 'destroy',
        trigger: 'onPlay',
        description: 'abilities.scorch.desc',
    }),
    MUSTER: (targetName: string): Ability => ({
        id: 'muster',
        name: 'abilities.muster.name',
        type: 'summon',
        trigger: 'onPlay',
        description: 'abilities.muster.desc',
        targetId: targetName, // Use targetId to store which card to muster
    }),
    COMMANDER_HORN: (): Ability => ({
        id: 'commander_horn',
        name: 'abilities.commander_horn.name',
        type: 'boost_row',
        trigger: 'onPlay',
        description: 'abilities.commander_horn.desc',
    }),
    FROST: (): Ability => ({
        id: 'frost',
        name: 'abilities.frost.name',
        type: 'weather',
        trigger: 'onPlay',
        description: 'abilities.frost.desc',
    }),
    FOG: (): Ability => ({
        id: 'fog',
        name: 'abilities.fog.name',
        type: 'weather',
        trigger: 'onPlay',
        description: 'abilities.fog.desc',
    }),
    CLEAR_WEATHER: (): Ability => ({
        id: 'clear_weather',
        name: 'abilities.clear_weather.name',
        type: 'clear',
        trigger: 'onPlay',
        description: 'abilities.clear_weather.desc',
    }),
    DECOY: (): Ability => ({
        id: 'decoy',
        name: 'abilities.decoy.name',
        type: 'decoy',
        trigger: 'onPlay',
        description: 'abilities.decoy.desc',
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
    artwork: any = '',
    isLocked?: boolean
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
    isLocked: isLocked ?? (rarity === 'epic' || rarity === 'legendary'),
});

// ============ UNIT CARDS ============

// Melee Units
const ORDER_MELEE: Card[] = [
    createCard('Swordsman', 'unit', 'common', 1, 3, [], 'cards.descriptions.swordsman', 'cards.flavor.swordsman', require('../../assets/units/melee/swordsman.jpg')),
    createCard('Knight', 'unit', 'common', 2, 5, [], 'cards.descriptions.knight', 'cards.flavor.knight', require('../../assets/units/melee/knight.jpg')),
    createCard('Berserker', 'unit', 'rare', 3, 7, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.berserker', 'cards.flavor.berserker', require('../../assets/units/melee/berserker.jpg')),
    createCard('Shield Captain', 'unit', 'rare', 3, 4, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.shield_captain', 'cards.flavor.shield_captain', require('../../assets/units/melee/shield_captain.jpg')),
    createCard('Champion', 'unit', 'epic', 4, 9, [], 'cards.descriptions.champion', 'cards.flavor.champion', require('../../assets/units/melee/champion.jpg')),
    createCard('Warlord', 'unit', 'legendary', 6, 12, [ABILITIES.MORALE_BOOST(2)], 'cards.descriptions.warlord', 'cards.flavor.warlord', require('../../assets/units/melee/warlord.jpg')),
].map(c => ({ ...c, faction: 'order' as Faction }));

const SHADOW_MELEE: Card[] = [
    createCard('Lich King', 'unit', 'legendary', 10, 12, [ABILITIES.MORALE_BOOST(2)], 'cards.descriptions.lich_king', 'cards.flavor.lich_king', require('../../assets/units/melee/lich_king.jpg')),
    createCard('Grave Ghoul', 'unit', 'common', 1, 3, [], 'cards.descriptions.grave_ghoul', 'cards.flavor.grave_ghoul', require('../../assets/units/melee/grave_ghoul.jpg')),
    createCard('Wight', 'unit', 'rare', 3, 5, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.wight', 'cards.flavor.wight', require('../../assets/units/melee/wight.jpg')),
    createCard('Skeleton Warrior', 'unit', 'common', 1, 2, [ABILITIES.MUSTER('Skeleton Warrior')], 'cards.descriptions.skeleton_warrior', 'cards.flavor.skeleton_warrior', require('../../assets/units/melee/skeleton_warrior.jpg')),
    createCard('Death Knight', 'unit', 'epic', 5, 10, [], 'cards.descriptions.death_knight', 'cards.flavor.death_knight', require('../../assets/units/melee/death_knight.jpg')),
    createCard('Zombie Horde', 'unit', 'common', 2, 1, [ABILITIES.MUSTER('Zombie Horde')], 'cards.descriptions.zombie_horde', 'cards.flavor.zombie_horde', require('../../assets/units/melee/zombie_horde.jpg')),
    createCard('Crypt Guard', 'unit', 'rare', 3, 6, [], 'cards.descriptions.crypt_guard', 'cards.flavor.crypt_guard', require('../../assets/units/melee/crypt_guard.jpg')),
].map(c => ({ ...c, faction: 'shadow' as Faction }));

const ARCANE_MELEE: Card[] = [
    createCard('Arcane Golem', 'unit', 'common', 2, 4, [], 'cards.descriptions.arcane_golem', '', require('../../assets/units/melee/arcane_golem.jpg')),
    createCard('Spellblade', 'unit', 'rare', 3, 5, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.spellblade', '', require('../../assets/units/melee/spellblade.jpg')),
    createCard('Mirror Image', 'unit', 'rare', 4, 2, [ABILITIES.MUSTER('Mirror Image')], 'cards.descriptions.mirror_image', '', require('../../assets/units/melee/mirror_image.jpg')),
    createCard('Arcane Guard', 'unit', 'common', 1, 3, [], 'cards.descriptions.arcane_guard', '', require('../../assets/units/melee/arcane_guard.jpg')),
    createCard('Crystal Construct', 'unit', 'common', 2, 5, [], 'cards.descriptions.crystal_construct', '', require('../../assets/units/melee/crystal_construct.jpg')),
    createCard('Spell-Thief', 'unit', 'rare', 3, 4, [ABILITIES.SPY(1)], 'cards.descriptions.spell_thief', '', require('../../assets/units/melee/spell_thief.jpg')),
    createCard('Void Walker', 'unit', 'epic', 5, 10, [], 'cards.descriptions.void_walker', '', require('../../assets/units/melee/void_walker.jpg')),
].map(c => ({ ...c, faction: 'arcane' as Faction }));

const NATURE_MELEE: Card[] = [
    createCard('Dire Wolf', 'unit', 'common', 1, 2, [ABILITIES.MUSTER('Dire Wolf')], 'cards.descriptions.dire_wolf', '', require('../../assets/units/melee/dire_wolf.jpg')),
    createCard('Forest Guardian', 'unit', 'rare', 4, 7, [], 'cards.descriptions.forest_guardian', '', require('../../assets/units/melee/forest_guardian.jpg')),
    createCard('Shapeshifter', 'unit', 'epic', 5, 6, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.shapeshifter', '', require('../../assets/units/melee/shapeshifter.jpg')),
    createCard('Bear Spirit', 'unit', 'common', 2, 5, [], 'cards.descriptions.bear_spirit', '', require('../../assets/units/melee/bear_spirit.jpg')),
    createCard('Wolf Pack Alpha', 'unit', 'rare', 3, 4, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.wolf_alpha', '', ''),
    createCard('Elder Ent', 'unit', 'legendary', 8, 15, [], 'cards.descriptions.elder_ent', '', ''),
    createCard('Wild Boar', 'unit', 'common', 1, 3, [ABILITIES.MUSTER('Wild Boar')], 'cards.descriptions.wild_boar', '', ''),
].map(c => ({ ...c, faction: 'nature' as Faction }));

const NEUTRAL_MELEE: Card[] = [
    createCard('Sellsword', 'unit', 'common', 2, 4, [], 'cards.descriptions.sellsword', '', ''),
    createCard('Bounty Hunter', 'unit', 'rare', 4, 5, [ABILITIES.SCORCH()], 'cards.descriptions.bounty_hunter', '', ''),
    createCard('Town Guard', 'unit', 'common', 1, 3, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.town_guard', '', ''),
    createCard('Bandit', 'unit', 'common', 1, 2, [ABILITIES.SPY(1)], 'cards.descriptions.bandit', '', ''),
    createCard('Knight Errant', 'unit', 'rare', 3, 6, [], 'cards.descriptions.knight_errant', '', ''),
].map(c => ({ ...c, faction: 'neutral' as Faction }));

export const MELEE_UNITS: Card[] = [
    ...ORDER_MELEE,
    ...SHADOW_MELEE,
    ...ARCANE_MELEE,
    ...NATURE_MELEE,
    ...NEUTRAL_MELEE,
].map(c => ({ ...c, category: 'melee' as const }));

// Ranged Units
const ORDER_RANGED: Card[] = [
    createCard('Archer', 'unit', 'common', 1, 2, [], 'cards.descriptions.archer', 'cards.flavor.archer', require('../../assets/units/ranged/archer.jpg')),
    createCard('Crossbowman', 'unit', 'common', 2, 4, [], 'cards.descriptions.crossbowman', 'cards.flavor.crossbowman', require('../../assets/units/ranged/crossbowman.jpg')),
    createCard('Elven Marksman', 'unit', 'rare', 3, 6, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.elven_marksman', 'cards.flavor.elven_marksman', require('../../assets/units/ranged/elven_marksman.jpg')),
    createCard('Scout', 'unit', 'rare', 2, 1, [ABILITIES.SPY(2)], 'cards.descriptions.scout', 'cards.flavor.scout', require('../../assets/units/ranged/scout.jpg')),
    createCard('Sniper', 'unit', 'epic', 4, 8, [], 'cards.descriptions.sniper', 'cards.flavor.sniper', require('../../assets/units/ranged/sniper.jpg')),
    createCard('Dragon Hunter', 'unit', 'legendary', 5, 10, [ABILITIES.SCORCH()], 'cards.descriptions.dragon_hunter', 'cards.flavor.dragon_hunter', require('../../assets/units/ranged/dragon_hunter.jpg')),
].map(c => ({ ...c, faction: 'order' as Faction }));

const SHADOW_RANGED: Card[] = [
    createCard('Dark Elf Archer', 'unit', 'common', 1, 3, [], 'cards.descriptions.dark_elf_archer', 'cards.flavor.dark_elf_archer', require('../../assets/units/ranged/dark_elf_archer.jpg')),
    createCard('Soul Harvester', 'unit', 'rare', 4, 3, [ABILITIES.SPY(2)], 'cards.descriptions.soul_harvester', 'cards.flavor.soul_harvester', require('../../assets/units/ranged/soul_harvester.jpg')),
    createCard('Banshee', 'unit', 'epic', 4, 7, [ABILITIES.SCORCH()], 'cards.descriptions.banshee', 'cards.flavor.banshee', require('../../assets/units/ranged/banshee.jpg')),
    createCard('Void Wizard', 'unit', 'rare', 3, 5, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.void_wizard', 'cards.flavor.void_wizard', require('../../assets/units/ranged/void_wizard.jpg')),
    createCard('Shadow Assassin', 'unit', 'epic', 4, 8, [], 'cards.descriptions.shadow_assassin', 'cards.flavor.shadow_assassin', require('../../assets/units/ranged/shadow_assassin.jpg')),
    createCard('Necromancer', 'unit', 'legendary', 6, 6, [ABILITIES.MEDIC()], 'cards.descriptions.necromancer', 'cards.flavor.necromancer', require('../../assets/units/ranged/necromancer.jpg')),
    createCard('Dark Elf Matriarch', 'unit', 'rare', 5, 7, [], 'cards.descriptions.dark_elf_matriarch', 'cards.flavor.dark_elf_matriarch', require('../../assets/units/ranged/dark_elf_matriarch.jpg')),
].map(c => ({ ...c, faction: 'shadow' as Faction }));

const ARCANE_RANGED: Card[] = [
    createCard('Apprentice', 'unit', 'common', 1, 2, [], 'cards.descriptions.apprentice', '', require('../../assets/units/ranged/apprentice.jpg')),
    createCard('Sorceress', 'unit', 'rare', 4, 4, [ABILITIES.MEDIC()], 'cards.descriptions.sorceress', '', require('../../assets/units/ranged/sorceress.jpg')),
    createCard('Archon', 'unit', 'epic', 6, 9, [], 'cards.descriptions.archon', '', require('../../assets/units/ranged/archon.jpg')),
    createCard('Mana Wyrm', 'unit', 'common', 1, 1, [ABILITIES.MUSTER('Mana Wyrm')], 'cards.descriptions.mana_wyrm', '', require('../../assets/units/ranged/mana_wyrm.jpg')),
    createCard('Ethereal Binder', 'unit', 'rare', 3, 4, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.ethereal_binder', '', require('../../assets/units/ranged/ethereal_binder.jpg')),
    createCard('Arcane Arch-Mage', 'unit', 'legendary', 7, 12, [ABILITIES.SCORCH()], 'cards.descriptions.arcane_archmage', '', require('../../assets/units/ranged/arcane_archmage.jpg')),
].map(c => ({ ...c, faction: 'arcane' as Faction }));

const NATURE_RANGED: Card[] = [
    createCard('Elven Scout', 'unit', 'common', 1, 2, [ABILITIES.SPY(2)], 'cards.descriptions.elven_scout', '', ''),
    createCard('Dryad', 'unit', 'rare', 3, 5, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.dryad', '', ''),
    createCard('Centaur Archer', 'unit', 'rare', 4, 6, [], 'cards.descriptions.centaur_archer', '', ''),
    createCard('Satyr Skirmisher', 'unit', 'common', 2, 3, [], 'cards.descriptions.satyr_skirmisher', '', ''),
    createCard('Elven Warden', 'unit', 'rare', 3, 4, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.elven_warden', '', ''),
    createCard('Wind Runner', 'unit', 'epic', 5, 8, [], 'cards.descriptions.wind_runner', '', ''),
].map(c => ({ ...c, faction: 'nature' as Faction }));

const NEUTRAL_RANGED: Card[] = [
    createCard('Caravan Guard', 'unit', 'common', 2, 3, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.caravan_guard', '', ''),
    createCard('Traveling Merchant', 'unit', 'rare', 3, 1, [ABILITIES.SPY(2)], 'cards.descriptions.traveling_merchant', '', ''),
    createCard('Hired Crossbow', 'unit', 'common', 2, 4, [], 'cards.descriptions.hired_crossbow', '', ''),
    createCard('Traveling Bard', 'unit', 'rare', 2, 2, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.traveling_bard', '', ''),
].map(c => ({ ...c, faction: 'neutral' as Faction }));

export const RANGED_UNITS: Card[] = [
    ...ORDER_RANGED,
    ...SHADOW_RANGED,
    ...ARCANE_RANGED,
    ...NATURE_RANGED,
    ...NEUTRAL_RANGED,
].map(c => ({ ...c, category: 'ranged' as const }));

// Siege Units
const ORDER_SIEGE: Card[] = [
    createCard('Catapult', 'unit', 'common', 2, 4, [], 'cards.descriptions.catapult', 'cards.flavor.catapult', require('../../assets/units/siege/catapult.jpg')),
    createCard('Ballista', 'unit', 'common', 3, 6, [], 'cards.descriptions.ballista', 'cards.flavor.ballista', require('../../assets/units/siege/ballista.jpg')),
    createCard('Trebuchet', 'unit', 'rare', 4, 8, [], 'cards.descriptions.trebuchet', 'cards.flavor.trebuchet', require('../../assets/units/siege/trebutchet.jpg')),
    createCard('War Elephant', 'unit', 'rare', 4, 6, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.war_elephant', 'cards.flavor.war_elephant', require('../../assets/units/siege/war_elephant.jpg')),
    createCard('Siege Tower', 'unit', 'epic', 5, 5, [ABILITIES.COMMANDER_HORN()], 'cards.descriptions.siege_tower', 'cards.flavor.siege_tower', require('../../assets/units/siege/siege_tower.jpg')),
    createCard('Dragon', 'unit', 'legendary', 8, 15, [], 'cards.descriptions.dragon', 'cards.flavor.dragon', require('../../assets/units/siege/dragon.jpg')),
].map(c => ({ ...c, faction: 'order' as Faction }));

const SHADOW_SIEGE: Card[] = [
    createCard('Bone Catapult', 'unit', 'common', 2, 4, [], 'cards.descriptions.bone_catapult', 'cards.flavor.bone_catapult', require('../../assets/units/siege/bone_catapult.jpg')),
    createCard('Plague Spreader', 'unit', 'rare', 4, 6, [], 'cards.descriptions.plague_spreader', 'cards.flavor.plague_spreader', require('../../assets/units/siege/plague_spreader.jpg')),
    createCard('Abomination', 'unit', 'epic', 6, 12, [], 'cards.descriptions.abomination', 'cards.flavor.abomination', require('../../assets/units/siege/abomination.jpg')),
    createCard('Demon Prince', 'unit', 'legendary', 10, 15, [], 'cards.descriptions.demon_prince', 'cards.flavor.demon_prince', require('../../assets/units/siege/demon_prince.jpg')),
    createCard('Hellhound', 'unit', 'common', 2, 3, [ABILITIES.MUSTER('Hellhound')], 'cards.descriptions.hellhound', 'cards.flavor.hellhound', require('../../assets/units/siege/hellhound.jpg')),
    createCard('Gargoyle', 'unit', 'common', 3, 4, [], 'cards.descriptions.gargoyle', 'cards.flavor.gargoyle', require('../../assets/units/siege/gargoyle.jpg')),
    createCard('Cursed Ballista', 'unit', 'rare', 4, 7, [], 'cards.descriptions.cursed_ballista', 'cards.flavor.cursed_ballista', require('../../assets/units/siege/cursed_ballista.jpg')),
].map(c => ({ ...c, faction: 'shadow' as Faction }));

const ARCANE_SIEGE: Card[] = [
    createCard('Mana Battery', 'unit', 'rare', 4, 4, [ABILITIES.COMMANDER_HORN()], 'cards.descriptions.mana_battery', '', require('../../assets/units/siege/mana_battery.jpg')),
    createCard('Ether Cannon', 'unit', 'legendary', 9, 14, [], 'cards.descriptions.ether_cannon', '', require('../../assets/units/siege/ether_cannon.jpg')),
    createCard('Leyline Conduit', 'unit', 'rare', 3, 5, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.leyline_conduit', '', require('../../assets/units/siege/leyline_conduit.jpg')),
    createCard('Prism Tower', 'unit', 'epic', 6, 8, [ABILITIES.COMMANDER_HORN()], 'cards.descriptions.prism_tower', '', require('../../assets/units/siege/prism_tower.jpg')),
    createCard('Energy Pylon', 'unit', 'common', 2, 3, [], 'cards.descriptions.energy_pylon', '', require('../../assets/units/siege/energy_pylon.jpg')),
].map(c => ({ ...c, faction: 'arcane' as Faction }));

const NATURE_SIEGE: Card[] = [
    createCard('Ancient Treant', 'unit', 'epic', 6, 10, [], 'cards.descriptions.ancient_treant', '', ''),
    createCard('Nature Wrath', 'unit', 'legendary', 10, 16, [], 'cards.descriptions.nature_wrath', '', ''),
    createCard('Ancient Oak', 'unit', 'rare', 4, 6, [ABILITIES.TIGHT_BOND()], 'cards.descriptions.ancient_oak', '', ''),
    createCard('Thorn Thrower', 'unit', 'common', 2, 4, [], 'cards.descriptions.thorn_thrower', '', ''),
    createCard('Vine Catapult', 'unit', 'common', 3, 5, [], 'cards.descriptions.vine_catapult', '', ''),
].map(c => ({ ...c, faction: 'nature' as Faction }));

const NEUTRAL_SIEGE: Card[] = [
    createCard('Old Catapult', 'unit', 'common', 3, 5, [], 'cards.descriptions.old_catapult', '', ''),
    createCard('Supply Wagon', 'unit', 'rare', 2, 2, [ABILITIES.MORALE_BOOST(1)], 'cards.descriptions.supply_wagon', '', ''),
    createCard('Ram', 'unit', 'common', 4, 8, [], 'cards.descriptions.ram', '', ''),
    createCard('Supply Balloon', 'unit', 'epic', 5, 4, [ABILITIES.COMMANDER_HORN()], 'cards.descriptions.supply_balloon', '', ''),
    createCard('Junk Launcher', 'unit', 'common', 2, 2, [ABILITIES.MUSTER('Junk Launcher')], 'cards.descriptions.junk_launcher', '', ''),
].map(c => ({ ...c, faction: 'neutral' as Faction }));

export const SIEGE_UNITS: Card[] = [
    ...ORDER_SIEGE,
    ...SHADOW_SIEGE,
    ...ARCANE_SIEGE,
    ...NATURE_SIEGE,
    ...NEUTRAL_SIEGE,
].map(c => ({ ...c, category: 'siege' as const }));

// ============ SPELL CARDS ============

export const SPELL_CARDS: Card[] = [
    createCard("Commander's Horn", 'spell', 'rare', 2, undefined, [ABILITIES.COMMANDER_HORN()], 'cards.descriptions.commanders_horn', undefined, require('../../assets/units/spell/commanders_horn.jpg')),
    createCard('Decoy', 'spell', 'common', 1, undefined, [ABILITIES.DECOY()], 'cards.descriptions.decoy', undefined, require('../../assets/units/spell/decoy.jpg')),
    createCard('Scorch', 'spell', 'epic', 3, undefined, [ABILITIES.SCORCH()], 'cards.descriptions.scorch_spell', undefined, require('../../assets/units/spell/scorch.jpg')),
    createCard('Resurrection', 'spell', 'rare', 2, undefined, [ABILITIES.MEDIC()], 'cards.descriptions.resurrection', undefined, require('../../assets/units/spell/resurrection.jpg')),
    // Sinister Expansion
    createCard('Dark Pact', 'spell', 'rare', 2, undefined, [ABILITIES.MEDIC()], 'cards.descriptions.dark_pact', undefined, require('../../assets/units/spell/dark_pact.jpg')),
    createCard('Void Bolt', 'spell', 'epic', 3, undefined, [ABILITIES.SCORCH()], 'cards.descriptions.void_bolt', undefined, require('../../assets/units/spell/void_bolt.jpg')),
    createCard('Life Drain', 'spell', 'rare', 2, undefined, [ABILITIES.COMMANDER_HORN()], 'cards.descriptions.life_drain', undefined, require('../../assets/units/spell/life_drain.jpg')),
    createCard('Raise Dead', 'spell', 'common', 2, undefined, [ABILITIES.MEDIC()], 'cards.descriptions.raise_dead', undefined, require('../../assets/units/spell/raise_dead.jpg')),
].map((c, i) => ({ ...c, faction: (i < 4 ? 'neutral' : 'shadow') as Faction }));

// ============ WEATHER CARDS ============

export const WEATHER_CARDS: Card[] = [
    createCard('Biting Frost', 'weather', 'common', 1, undefined, [ABILITIES.FROST()], 'cards.descriptions.frost', undefined, require('../../assets/units/weather/biting_frost.jpg')),
    createCard('Impenetrable Fog', 'weather', 'common', 1, undefined, [ABILITIES.FOG()], 'cards.descriptions.fog', undefined, require('../../assets/units/weather/impenetrable_fog.jpg')),
    createCard('Clear Skies', 'weather', 'common', 0, undefined, [ABILITIES.CLEAR_WEATHER()], 'cards.descriptions.clear_weather', undefined, require('../../assets/units/weather/clear_skies.jpg')),
    // Sinister Expansion
    createCard('Corrupt Ground', 'weather', 'common', 1, undefined, [ABILITIES.FROST()], 'cards.descriptions.corrupt_ground', undefined, require('../../assets/units/weather/corrupt_ground.jpg')),
    createCard('Wailing Fog', 'weather', 'common', 1, undefined, [ABILITIES.FOG()], 'cards.descriptions.wailing_fog', undefined, require('../../assets/units/weather/wailing_fog.jpg')),
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
            name: 'abilities.ability_rally.name',
            type: 'boost_all',
            trigger: 'activate',
            description: 'abilities.ability_rally.desc',
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
            name: 'abilities.ability_dark_command.name',
            type: 'damage_strongest',
            trigger: 'activate',
            description: 'abilities.ability_dark_command.desc',
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
            name: 'abilities.ability_arcane_blast.name',
            type: 'damage_all', // We will implement this in gameEngine
            trigger: 'activate',
            description: 'abilities.ability_arcane_blast.desc',
            value: 1,
            cooldown: 4,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_archmage.jpg'),
        className: 'Mage',
        faction: 'arcane',
        flavorText: 'cards.flavor.archmage',
    },
    {
        id: 'hero_ranger',
        name: 'Ranger',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_precision_strike',
            name: 'abilities.ability_precision_strike.name',
            type: 'destroy_weakest', // We will implement this in gameEngine
            trigger: 'activate',
            description: 'abilities.ability_precision_strike.desc',
            value: 1, // Doesn't use value, but for consistency
            cooldown: 4,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_ranger.jpg'),
        className: 'Hunter',
        faction: 'nature',
        flavorText: 'cards.flavor.ranger',
    },
    {
        id: 'hero_paladin',
        name: 'Paladin',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_divine_shield',
            name: 'abilities.ability_divine_shield.name',
            type: 'heal',
            trigger: 'activate',
            description: 'abilities.ability_divine_shield.desc',
            value: 2,
            cooldown: 3,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_paladin.jpg'),
        className: 'Cleric',
        faction: 'order',
        flavorText: 'cards.flavor.paladin',
    },
    {
        id: 'hero_rogue',
        name: 'Trickster',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_quick_draw',
            name: 'abilities.ability_quick_draw.name',
            type: 'draw_card',
            trigger: 'activate',
            description: 'abilities.ability_quick_draw.desc',
            value: 1,
            cooldown: 4,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_rogue.jpg'),
        className: 'Rogue',
        faction: 'neutral',
        flavorText: 'cards.flavor.rogue',
    },
    {
        id: 'hero_berserker',
        name: 'Berserker',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_bloodlust',
            name: 'abilities.ability_bloodlust.name',
            type: 'damage_random',
            trigger: 'activate',
            description: 'abilities.ability_bloodlust.desc',
            value: 1,
            cooldown: 2,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_berserker.jpg'),
        className: 'Fighter',
        faction: 'order',
        flavorText: 'cards.flavor.beserker_hero',
    },
    {
        id: 'hero_druid',
        name: 'Druid',
        health: 2,
        maxHealth: 2,
        ability: {
            id: 'ability_nature_growth',
            name: 'abilities.ability_nature_growth.name',
            type: 'boost_random',
            trigger: 'activate',
            description: 'abilities.ability_nature_growth.desc',
            value: 2,
            cooldown: 3,
            currentCooldown: 0,
        },
        artwork: require('../../assets/heroes/hero_druid.jpg'),
        className: 'Shaman',
        faction: 'nature',
        flavorText: 'cards.flavor.druid',
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

export const FACTION_LORE: Record<string, { title: string; description: string }> = {
    order: {
        title: 'factions.order.title',
        description: 'factions.order.desc'
    },
    shadow: {
        title: 'factions.shadow.title',
        description: 'factions.shadow.desc'
    },
    nature: {
        title: 'factions.nature.title',
        description: 'factions.nature.desc'
    },
    arcane: {
        title: 'factions.arcane.title',
        description: 'factions.arcane.desc'
    },
    neutral: {
        title: 'factions.neutral.title',
        description: 'factions.neutral.desc'
    }
};

// ============ TALENT TREES ============

export const TALENT_TREES: Record<string, TalentTree> = {
    hero_commander: {
        heroId: 'hero_commander',
        talents: [
            {
                id: 't_cmd_1',
                name: 'talents.hero_commander.t_cmd_1.name',
                description: 'talents.hero_commander.t_cmd_1.desc',
                icon: 'heart',
                effect: { type: 'stat_boost', target: 'hero_health', value: 1 },
                position: { x: 100, y: 100 }
            },
            {
                id: 't_cmd_2',
                name: 'talents.hero_commander.t_cmd_2.name',
                description: 'talents.hero_commander.t_cmd_2.desc',
                icon: 'flash',
                effect: { type: 'stat_boost', target: 'starting_mana', value: 2 },
                requirements: ['t_cmd_1'],
                position: { x: 100, y: 250 }
            },
            {
                id: 't_cmd_3',
                name: 'talents.hero_commander.t_cmd_3.name',
                description: 'talents.hero_commander.t_cmd_3.desc',
                icon: 'shield',
                effect: { type: 'faction_bonus', faction: 'order', attackBoost: 1 },
                requirements: ['t_cmd_2'],
                position: { x: 100, y: 400 }
            },
        ]
    },
    hero_darklord: {
        heroId: 'hero_darklord',
        talents: [
            {
                id: 't_dark_1',
                name: 'talents.hero_darklord.t_dark_1.name',
                description: 'talents.hero_darklord.t_dark_1.desc',
                icon: 'stopwatch',
                effect: { type: 'stat_boost', target: 'hero_power_cooldown', value: -1 },
                position: { x: 100, y: 100 }
            },
            {
                id: 't_dark_2',
                name: 'talents.hero_darklord.t_dark_2.name',
                description: 'talents.hero_darklord.t_dark_2.desc',
                icon: 'flash',
                effect: { type: 'stat_boost', target: 'starting_mana', value: 3 },
                requirements: ['t_dark_1'],
                position: { x: 100, y: 250 }
            },
        ]
    },
    hero_archmage: {
        heroId: 'hero_archmage',
        talents: [
            {
                id: 't_mage_1',
                name: 'talents.hero_archmage.t_mage_1.name',
                description: 'talents.hero_archmage.t_mage_1.desc',
                icon: 'flash',
                effect: { type: 'stat_boost', target: 'starting_mana', value: 3 },
                position: { x: 100, y: 100 }
            },
            {
                id: 't_mage_2',
                name: 'talents.hero_archmage.t_mage_2.name',
                description: 'talents.hero_archmage.t_mage_2.desc',
                icon: 'documents',
                effect: { type: 'stat_boost', target: 'starting_mana', value: 2 }, // Placeholder
                requirements: ['t_mage_1'],
                position: { x: 100, y: 250 }
            },
        ]
    },
    hero_ranger: {
        heroId: 'hero_ranger',
        talents: [
            {
                id: 't_rng_1',
                name: 'talents.hero_ranger.t_rng_1.name',
                description: 'talents.hero_ranger.t_rng_1.desc',
                icon: 'leaf',
                effect: { type: 'faction_bonus', faction: 'nature', attackBoost: 1 },
                position: { x: 100, y: 100 }
            },
            {
                id: 't_rng_2',
                name: 'talents.hero_ranger.t_rng_2.name',
                description: 'talents.hero_ranger.t_rng_2.desc',
                icon: 'stopwatch',
                effect: { type: 'stat_boost', target: 'hero_power_cooldown', value: -1 },
                requirements: ['t_rng_1'],
                position: { x: 100, y: 250 }
            },
        ]
    },
    hero_paladin: {
        heroId: 'hero_paladin',
        talents: [
            {
                id: 't_pal_1',
                name: 'talents.hero_paladin.t_pal_1.name',
                description: 'talents.hero_paladin.t_pal_1.desc',
                icon: 'heart',
                effect: { type: 'stat_boost', target: 'hero_health', value: 2 },
                position: { x: 100, y: 100 }
            },
            {
                id: 't_pal_2',
                name: 'talents.hero_paladin.t_pal_2.name',
                description: 'talents.hero_paladin.t_pal_2.desc',
                icon: 'shield',
                effect: { type: 'faction_bonus', faction: 'order', attackBoost: 1 },
                requirements: ['t_pal_1'],
                position: { x: 100, y: 250 }
            },
        ]
    },
    hero_druid: {
        heroId: 'hero_druid',
        talents: [
            {
                id: 't_dru_1',
                name: 'talents.hero_druid.t_dru_1.name',
                description: 'talents.hero_druid.t_dru_1.desc',
                icon: 'leaf',
                effect: { type: 'faction_bonus', faction: 'nature', attackBoost: 1 },
                position: { x: 100, y: 100 }
            },
            {
                id: 't_dru_2',
                name: 'talents.hero_druid.t_dru_2.name',
                description: 'talents.hero_druid.t_dru_2.desc',
                icon: 'flash',
                effect: { type: 'stat_boost', target: 'starting_mana', value: 2 },
                requirements: ['t_dru_1'],
                position: { x: 100, y: 250 }
            },
        ]
    }
};

export const getTalentTreeForHero = (heroId: string): TalentTree | undefined => {
    return TALENT_TREES[heroId];
};

