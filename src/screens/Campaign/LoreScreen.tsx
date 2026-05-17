import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../../store/campaignStore';
import { MAP_BIOMES } from './constants';

type LoreScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lore'>;

interface Props {
    navigation: LoreScreenNavigationProp;
}

interface LoreEntry {
    id: string;
    titleKey: string;
    contentKey: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    biomeId: string;
    unlockStage: number;
}

const LORE_ENTRIES: LoreEntry[] = [
    { id: 'verdant_echo_1', titleKey: 'lore.entries.verdant_echo_1.title', contentKey: 'lore.entries.verdant_echo_1.content', icon: 'star-four-points-outline', biomeId: 'verdant_echo', unlockStage: 0 },
    { id: 'verdant_echo_2', titleKey: 'lore.entries.verdant_echo_2.title', contentKey: 'lore.entries.verdant_echo_2.content', icon: 'leaf', biomeId: 'verdant_echo', unlockStage: 0 },
    { id: 'verdant_echo_3', titleKey: 'lore.entries.verdant_echo_3.title', contentKey: 'lore.entries.verdant_echo_3.content', icon: 'tree-outline', biomeId: 'verdant_echo', unlockStage: 20 },
    { id: 'azure_spire_1', titleKey: 'lore.entries.azure_spire_1.title', contentKey: 'lore.entries.azure_spire_1.content', icon: 'sword-cross', biomeId: 'azure_spire', unlockStage: 41 },
    { id: 'azure_spire_2', titleKey: 'lore.entries.azure_spire_2.title', contentKey: 'lore.entries.azure_spire_2.content', icon: 'castle', biomeId: 'azure_spire', unlockStage: 41 },
    { id: 'azure_spire_3', titleKey: 'lore.entries.azure_spire_3.title', contentKey: 'lore.entries.azure_spire_3.content', icon: 'telescope', biomeId: 'azure_spire', unlockStage: 61 },
    { id: 'twilight_rift_1', titleKey: 'lore.entries.twilight_rift_1.title', contentKey: 'lore.entries.twilight_rift_1.content', icon: 'auto-fix', biomeId: 'twilight_rift', unlockStage: 81 },
    { id: 'twilight_rift_2', titleKey: 'lore.entries.twilight_rift_2.title', contentKey: 'lore.entries.twilight_rift_2.content', icon: 'lightning-bolt', biomeId: 'twilight_rift', unlockStage: 81 },
    { id: 'twilight_rift_3', titleKey: 'lore.entries.twilight_rift_3.title', contentKey: 'lore.entries.twilight_rift_3.content', icon: 'ear-hearing', biomeId: 'twilight_rift', unlockStage: 101 },
    { id: 'crimson_wake_1', titleKey: 'lore.entries.crimson_wake_1.title', contentKey: 'lore.entries.crimson_wake_1.content', icon: 'fire', biomeId: 'crimson_wake', unlockStage: 121 },
    { id: 'crimson_wake_2', titleKey: 'lore.entries.crimson_wake_2.title', contentKey: 'lore.entries.crimson_wake_2.content', icon: 'skull', biomeId: 'crimson_wake', unlockStage: 121 },
    { id: 'crimson_wake_3', titleKey: 'lore.entries.crimson_wake_3.title', contentKey: 'lore.entries.crimson_wake_3.content', icon: 'water', biomeId: 'crimson_wake', unlockStage: 141 },
    { id: 'obsidian_heart_1', titleKey: 'lore.entries.obsidian_heart_1.title', contentKey: 'lore.entries.obsidian_heart_1.content', icon: 'diamond-stone', biomeId: 'obsidian_heart', unlockStage: 161 },
    { id: 'obsidian_heart_2', titleKey: 'lore.entries.obsidian_heart_2.title', contentKey: 'lore.entries.obsidian_heart_2.content', icon: 'eye-outline', biomeId: 'obsidian_heart', unlockStage: 161 },
    { id: 'obsidian_heart_3', titleKey: 'lore.entries.obsidian_heart_3.title', contentKey: 'lore.entries.obsidian_heart_3.content', icon: 'heart-broken', biomeId: 'obsidian_heart', unlockStage: 181 },
];

export const LoreScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { currentNodeId } = useCampaignStore();

    const [selectedBiomeId, setSelectedBiomeId] = useState('verdant_echo');

    const selectedBiome = MAP_BIOMES.find(b => b.id === selectedBiomeId)!;
    const isBiomeUnlocked = (biome: typeof MAP_BIOMES[0]) => currentNodeId >= biome.start;
    const isEntryUnlocked = (entry: LoreEntry) => currentNodeId >= entry.unlockStage;

    const currentEntries = LORE_ENTRIES.filter(e => e.biomeId === selectedBiomeId);
    const HEADER_HEIGHT = insets.top + 60;
    const TABS_HEIGHT = 52;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void ?? '#050505']}
                style={StyleSheet.absoluteFill}
            />

            {/* Biome tinted background accent */}
            <LinearGradient
                colors={[`${selectedBiome.colors[0]}18`, 'transparent']}
                style={[StyleSheet.absoluteFill, { bottom: '40%' }]}
            />

            {/* === SCROLL CONTENT === */}
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: 0, paddingBottom: insets.bottom + 40 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* === HEADER (now inside scroll) === */}
                <View style={[styles.header, { height: HEADER_HEIGHT }]}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.3)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.headerInner, { paddingTop: insets.top + 4 }]}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <MaterialCommunityIcons name="chevron-left" size={32} color={colors.arcane.emerald} />
                        </Pressable>
                        <Text style={styles.title}>{t('lore.title').toUpperCase()}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.headerBottomBorder} />
                </View>

                {/* === BIOME TABS (now inside scroll) === */}
                <View style={[styles.tabsWrapper]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsScroll}
                    >
                        {MAP_BIOMES.map(biome => {
                            const active = biome.id === selectedBiomeId;
                            const unlocked = isBiomeUnlocked(biome);
                            return (
                                <Pressable
                                    key={biome.id}
                                    onPress={() => setSelectedBiomeId(biome.id)}
                                    style={[
                                        styles.tab,
                                        active && { borderColor: biome.colors[0], backgroundColor: `${biome.colors[0]}22` },
                                        !unlocked && styles.tabLocked,
                                    ]}
                                >
                                    {!unlocked && (
                                        <MaterialCommunityIcons name="lock" size={10} color="rgba(255,255,255,0.3)" style={{ marginRight: 4 }} />
                                    )}
                                    <Text style={[
                                        styles.tabText,
                                        active && { color: biome.colors[0] },
                                        !unlocked && { color: 'rgba(255,255,255,0.25)' },
                                    ]}>
                                        {t(`biome.${biome.id}`).toUpperCase()}
                                    </Text>
                                    {active && (
                                        <View style={{ backgroundColor: biome.colors[0] }} />
                                    )}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                    <View style={[styles.tabsBottomBorder, { backgroundColor: `${selectedBiome.colors[0]}33` }]} />
                </View>

                <View style={{ height: 20 }} />

                {/* Biome header row */}
                <Animated.View entering={FadeIn} style={styles.biomeHeader}>
                    <View style={[styles.biomeColorBar, { backgroundColor: selectedBiome.colors[0] }]} />
                    <View>
                        <Text style={[styles.biomeName, { color: selectedBiome.colors[0] }]}>
                            {t(`biome.${selectedBiome.id}`).toUpperCase()}
                        </Text>
                        {!isBiomeUnlocked(selectedBiome) && (
                            <Text style={styles.biomeLockedHint}>
                                {t('lore.locked_desc', { biome: t(`biome.${selectedBiome.id}`) })}
                            </Text>
                        )}
                    </View>
                </Animated.View>

                {/* Lore entries */}
                {currentEntries.map((entry, index) => {
                    const unlocked = isEntryUnlocked(entry);
                    return (
                        <Animated.View
                            key={entry.id}
                            entering={FadeInDown.delay(index * 120)}
                            style={[styles.entryCard, !unlocked && styles.entryCardLocked]}
                        >
                            <LinearGradient
                                colors={unlocked
                                    ? [`${selectedBiome.colors[0]}15`, 'transparent']
                                    : ['rgba(255,255,255,0.02)', 'transparent']
                                }
                                style={StyleSheet.absoluteFill}
                            />

                            {/* Icon */}
                            <View style={[
                                styles.iconContainer,
                                { borderColor: unlocked ? selectedBiome.colors[0] : 'rgba(255,255,255,0.08)' },
                            ]}>
                                <MaterialCommunityIcons
                                    name={unlocked ? entry.icon : 'lock'}
                                    size={22}
                                    color={unlocked ? selectedBiome.colors[0] : 'rgba(255,255,255,0.15)'}
                                />
                            </View>

                            {/* Text content */}
                            <View style={styles.entryTextContent}>
                                <Text style={[
                                    styles.entryTitle,
                                    { color: unlocked ? selectedBiome.colors[0] : 'rgba(255,255,255,0.2)' },
                                ]}>
                                    {unlocked ? t(entry.titleKey).toUpperCase() : t('lore.locked').toUpperCase()}
                                </Text>
                                <View style={[styles.divider, {
                                    backgroundColor: unlocked ? selectedBiome.colors[0] : 'rgba(255,255,255,0.06)',
                                }]} />
                                <Text style={[
                                    styles.entryContent,
                                    !unlocked && styles.entryContentLocked,
                                ]}>
                                    {unlocked
                                        ? t(entry.contentKey)
                                        : t('lore.locked_desc', { biome: t(`biome.${selectedBiome.id}`) })
                                    }
                                </Text>
                            </View>

                            {/* Unlock stage badge */}
                            {!unlocked && (
                                <View style={styles.stageBadge}>
                                    <MaterialCommunityIcons name="map-marker" size={10} color="rgba(255,255,255,0.3)" />
                                    <Text style={styles.stageBadgeText}>{entry.unlockStage}</Text>
                                </View>
                            )}
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    // ─── Header ──────────────────────────────────────────
    header: {
        width: '100%',
        overflow: 'hidden',
    },
    headerInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerBottomBorder: {
        height: 1,
        backgroundColor: 'rgba(16,185,129,0.15)',
    },
    backBtn: {
        width: 40, height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        color: colors.arcane.white,
        fontFamily: 'serif',
        fontWeight: '900',
        letterSpacing: 8,
    },
    // ─── Tabs ────────────────────────────────────────────
    tabsWrapper: {
        width: '100%',
        height: 52,
        overflow: 'hidden',
    },
    tabsScroll: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 8,
        flexDirection: 'row',
        flex: 1,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        position: 'relative',
    },
    tabLocked: {
        opacity: 0.5,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        color: 'rgba(255,255,255,0.35)',
    },
    tabsBottomBorder: {
        position: 'absolute',
        bottom: 0,
        left: 0, right: 0,
        height: 1,
    },
    // ─── Content ─────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: 0, // Header and tabs handle their own padding
    },
    biomeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    biomeColorBar: {
        width: 3,
        height: 36,
        borderRadius: 2,
    },
    biomeName: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 3,
        fontFamily: 'serif',
    },
    biomeLockedHint: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 2,
    },
    // ─── Entry Cards ──────────────────────────────────────
    entryCard: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 18,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.12)',
        overflow: 'hidden',
        position: 'relative',
    },
    entryCardLocked: {
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        marginRight: 16,
        flexShrink: 0,
    },
    entryTextContent: {
        flex: 1,
    },
    entryTitle: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
        fontFamily: 'serif',
    },
    divider: {
        height: 1,
        width: 36,
        marginBottom: 10,
    },
    entryContent: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 21,
    },
    entryContentLocked: {
        color: 'rgba(255,255,255,0.2)',
        fontStyle: 'italic',
    },
    stageBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    stageBadgeText: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.25)',
        fontWeight: '900',
    },
});
