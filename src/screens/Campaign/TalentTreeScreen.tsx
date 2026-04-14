import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useCampaignStore } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import { getTalentTreeForHero } from '../../data/cardData';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Path, vec, Group, Blur, DashPathEffect } from '@shopify/react-native-skia';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'TalentTree'>;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TalentNode = ({ talent, unlocked, selected, available, onPress, index }: any) => {
    const pulse = useSharedValue(0);

    useEffect(() => {
        if (available && !unlocked) {
            pulse.value = withRepeat(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            pulse.value = 0;
        }
    }, [available, unlocked]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + pulse.value * 0.3 }],
        opacity: 0.8 - pulse.value * 0.6,
    }));

    return (
        <Animated.View
            entering={FadeInUp.delay(index * 30 + 100)}
            style={{ position: 'absolute', left: talent.position.x, top: talent.position.y }}
        >
            {/* Pulsing Aura for Available Nodes */}
            {available && !unlocked && (
                <Animated.View style={[styles.pulseAura, pulseStyle]} pointerEvents="none" />
            )}

            <TouchableOpacity
                style={[
                    styles.talentNode,
                    unlocked && styles.talentNodeUnlocked,
                    selected && styles.talentNodeSelected,
                    (!unlocked && !available) && styles.talentNodeLocked
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={talent.icon as any}
                    size={28}
                    color={unlocked || selected ? colors.arcane.white : 'rgba(255,255,255,0.3)'}
                />
            </TouchableOpacity>
        </Animated.View>
    );
};

export const TalentTreeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { talentPoints, unlockedTalentIds, unlockTalent } = useCampaignStore();
    const { getActiveDeck } = useDeckStore();

    const activeDeck = getActiveDeck();
    const heroId = activeDeck?.heroId || 'hero_commander';
    const tree = useMemo(() => getTalentTreeForHero(heroId), [heroId]);

    const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);

    const selectedTalent = useMemo(() =>
        tree?.talents.find(t => t.id === selectedTalentId),
        [tree, selectedTalentId]);

    const handleUnlock = () => {
        if (!selectedTalentId) return;

        const res = unlockTalent(selectedTalentId);
        if (res.success) {
            // Success feedback
        } else {
            Alert.alert('Ascension Failed', res.message);
        }
    };

    const isUnlocked = (id: string) => unlockedTalentIds.includes(id);

    const canUnlock = (talent: any) => {
        if (isUnlocked(talent.id)) return false;
        if (talentPoints < 1) return false;
        if (!talent.requirements || talent.requirements.length === 0) return true;
        return talent.requirements.every((reqId: string) => isUnlocked(reqId));
    };

    return (
        <View style={styles.container}>
            {/* Animated Void Background */}
            <ExpoLinearGradient
                colors={['#0f172a', '#1e1b4b', '#000000']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <ExpoLinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
                style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text variant="h2" style={styles.title}>{t('talent_tree.title')}</Text>
                    <Text variant="caption" style={styles.subtitle}>{t('talent_tree.subtitle')}</Text>
                </View>
                <View style={styles.pointsDisplay}>
                    <Ionicons name="sparkles" size={12} color={colors.arcane.emerald} style={{ marginRight: 4 }} />
                    <Text style={styles.pointsValue}>{talentPoints}</Text>
                    <Text style={styles.pointsLabel}> {t('common.points_abbr').toUpperCase()}</Text>
                </View>
            </ExpoLinearGradient>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.verticalScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <ScrollView
                    horizontal
                    contentContainerStyle={styles.horizontalScrollContent}
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.treeView}>
                        {/* Skia Connections */}
                        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                            {tree?.talents.map(talent => {
                                if (!talent.requirements) return null;
                                return talent.requirements.map(reqId => {
                                    const reqTalent = tree.talents.find(t => t.id === reqId);
                                    if (!reqTalent) return null;

                                    // Base width of node is 60, offset path to center (30,30)
                                    const start = vec(reqTalent.position.x + 30, reqTalent.position.y + 30);
                                    const end = vec(talent.position.x + 30, talent.position.y + 30);
                                    const active = isUnlocked(talent.id) || (isUnlocked(reqId) && canUnlock(talent));
                                    const fullyUnlocked = isUnlocked(talent.id) && isUnlocked(reqId);

                                    return (
                                        <Group key={`link-${reqId}-${talent.id}`}>
                                            <Path
                                                path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                                                strokeWidth={fullyUnlocked ? 4 : 2}
                                                style="stroke"
                                                color={fullyUnlocked ? colors.arcane.emerald : (active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)')}
                                            >
                                                {fullyUnlocked && <Blur blur={6} />}
                                                {!active && <DashPathEffect intervals={[5, 10]} />}
                                            </Path>
                                            {/* Core rigid line over the blur */}
                                            {fullyUnlocked && (
                                                <Path
                                                    path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                                                    strokeWidth={2}
                                                    style="stroke"
                                                    color="#fff"
                                                />
                                            )}
                                        </Group>
                                    );
                                });
                            })}
                        </Canvas>

                        {/* Talent Nodes */}
                        {tree?.talents.map((talent, index) => (
                            <TalentNode
                                key={talent.id}
                                talent={talent}
                                index={index}
                                unlocked={isUnlocked(talent.id)}
                                selected={selectedTalentId === talent.id}
                                available={canUnlock(talent)}
                                onPress={() => setSelectedTalentId(talent.id)}
                            />
                        ))}
                    </View>
                </ScrollView>
            </ScrollView>

            {/* Info Panel - Glassmorphism */}
            {selectedTalent && (
                <Animated.View entering={FadeInDown.springify().damping(20)} style={styles.infoPanelWrapper}>
                    <BlurView
                        intensity={90}
                        tint="dark"
                        style={[styles.infoPanel, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
                    >
                        <View style={styles.talentInfoHeader}>
                            <View style={{ flex: 1, paddingRight: 20 }}>
                                <Text style={styles.talentTitle}>{t(`talents.${selectedTalent.id}.name`).toUpperCase()}</Text>
                                <Text style={styles.talentDescription} numberOfLines={3}>{t(`talents.${selectedTalent.id}.desc`)}</Text>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.unlockButton,
                                    !canUnlock(selectedTalent) && styles.unlockButtonDisabled,
                                    isUnlocked(selectedTalent.id) && styles.unlockButtonSuccess
                                ]}
                                disabled={!canUnlock(selectedTalent)}
                                onPress={handleUnlock}
                            >
                                <ExpoLinearGradient
                                    colors={
                                        isUnlocked(selectedTalent.id) ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] :
                                            canUnlock(selectedTalent) ? [colors.arcane.emeraldDark, colors.arcane.emerald] :
                                                ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                                    }
                                    style={styles.unlockGradient}
                                >
                                    <Text style={[
                                        styles.unlockButtonText,
                                        isUnlocked(selectedTalent.id) && { color: colors.arcane.white, opacity: 0.7 },
                                        !canUnlock(selectedTalent) && !isUnlocked(selectedTalent.id) && { color: 'rgba(255,255,255,0.3)' }
                                    ]}>
                                        {isUnlocked(selectedTalent.id) ? t('talent_tree.ascended').toUpperCase() : t('talent_tree.ascend_cost', { cost: 1 }).toUpperCase()}
                                    </Text>
                                </ExpoLinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian, // fallback
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        zIndex: 10,
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        color: colors.arcane.white,
        fontFamily: typography.fonts.heading,
        fontWeight: '900',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 10,
        color: colors.arcane.cyan,
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginTop: 2,
    },
    pointsDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
    },
    pointsLabel: {
        fontSize: 10,
        color: colors.arcane.emerald,
        fontWeight: '700',
        letterSpacing: 1,
    },
    pointsValue: {
        fontSize: 16,
        color: colors.arcane.white,
        fontWeight: '900',
    },
    verticalScrollContent: {
        flexGrow: 1,
        paddingTop: 80, // reduced to pull the whole tree upward
        paddingBottom: 150, // accommodate absolute info panel
    },
    horizontalScrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing['2xl'], // removed vertical padding
        alignItems: 'center',
        justifyContent: 'center',
    },
    treeView: {
        width: 500, // Canvas fixed dimension wrapper
        height: 600,
        alignSelf: 'center',
        marginTop: -80, // Physically pull the entire tree up higher on the screen
    },
    talentNode: {
        width: 60,
        height: 60,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
        overflow: 'hidden',
    },
    talentNodeUnlocked: {
        borderColor: colors.arcane.emerald,
        backgroundColor: 'rgba(16,185,129,0.15)',
        shadowColor: colors.arcane.emeraldLight,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    talentNodeSelected: {
        borderColor: colors.arcane.cyan,
        backgroundColor: 'rgba(6,182,212,0.2)',
        shadowColor: colors.arcane.cyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        transform: [{ rotate: '45deg' }, { scale: 1.15 }],
        borderWidth: 2,
    },
    talentNodeLocked: {
        opacity: 0.6,
    },
    pulseAura: {
        width: 60,
        height: 60,
        borderRadius: 30, // Circle behind the rotated quad
        backgroundColor: colors.arcane.emerald,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    infoPanelWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(16,185,129,0.3)',
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    infoPanel: {
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    talentInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    talentTitle: {
        fontSize: 16,
        color: colors.arcane.white,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: typography.fonts.heading,
        marginBottom: 8,
    },
    talentDescription: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
    },
    unlockButton: {
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
    },
    unlockButtonDisabled: {
        borderColor: 'rgba(255,255,255,0.1)',
        opacity: 0.5,
    },
    unlockButtonSuccess: {
        borderColor: 'transparent',
    },
    unlockGradient: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unlockButtonText: {
        color: colors.arcane.white,
        fontWeight: '900',
        letterSpacing: 1.5,
        fontSize: 12,
    },
});
