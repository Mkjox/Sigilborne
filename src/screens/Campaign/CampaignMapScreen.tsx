import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    useWindowDimensions,
    Modal,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeOut,
    FadeInUp,
    SlideInDown,
    SlideOutDown,
    useSharedValue,
    useAnimatedScrollHandler,
    useDerivedValue,
    useAnimatedStyle,
    interpolate,
    withRepeat,
    withTiming,
    Easing,
    useAnimatedReaction,
    runOnJS,
    SharedValue,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { RootStackParamList, Difficulty } from '../../types';
import { Text } from '../../components/ui';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { CampaignMapSkiaBackground } from './components/CampaignMapSkiaBackground';
import { MapParallaxLayers } from './components/MapParallaxLayers';
import { RelicTray } from '../../components/campaign/RelicTray';
import { TOTAL_STAGES, MAP_BIOMES } from './constants';
import { generateCampaignMap, MapNode as MapNodeTypeData } from '../../data/campaignData';
import { useCampaignStore } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import i18n from '../../i18n';

type CampaignMapNavigationProp = StackNavigationProp<RootStackParamList, 'CampaignMap'>;

interface Props {
    navigation: CampaignMapNavigationProp;
}

export const CampaignMapScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const mapRef = React.useRef<ScrollView>(null);
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
    const [selectedStage, setSelectedStage] = useState<number | null>(null);
    const [stageModalVisible, setStageModalVisible] = useState(false);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 }); // Initial window

    // Use deterministic generation
    const stages = useMemo(() => generateCampaignMap(TOTAL_STAGES), []);

    // Campaign State
    const { currentNodeId, completedNodes, advanceToNode, gold, talentPoints, difficulty: selectedDifficulty, setDifficulty } = useCampaignStore();

    // Calculate logical row for each stage to determine vertical position
    const stageLayouts = useMemo(() => {
        const layouts: Record<number, { top: number, left: number }> = {};
        const NODE_DISTANCE = 114;
        let currentRow = 0;

        stages.forEach((stage, idx) => {
            if (stage.branch === 'right') {
                // Shares row with previous 'left' branch
                layouts[stage.id] = {
                    top: (currentRow - 1) * NODE_DISTANCE,
                    left: (stage.x / 100) * screenWidth
                };
            } else {
                layouts[stage.id] = {
                    top: currentRow * NODE_DISTANCE,
                    left: (stage.x / 100) * screenWidth
                };
                currentRow++;
            }
        });

        // We want Level 1 to be at the bottom, and Level 200 at the top.
        // ScrollView content flows from top (0) to bottom (totalHeight).
        const maxTop = (currentRow - 1) * NODE_DISTANCE;

        // Offset everything so Level 200 is at top: 0
        stages.forEach(s => {
            const l = layouts[s.id];
            l.top = maxTop - l.top;
        });

        return { layouts, totalHeight: maxTop + 200 };
    }, [stages, screenWidth]);


    // throttled windowing logic
    const viewportHeight = screenHeight;
    useAnimatedReaction(
        () => {
            if (!stageLayouts.totalHeight) return [0, 30];
            const maxTop = stageLayouts.totalHeight - 200;
            const currentScroll = scrollY.value;

            // Inverted logic: Level 1 is at scrollY = maxTop
            const topRow = (maxTop - currentScroll) / 114;
            const bottomRow = (maxTop - (currentScroll + viewportHeight)) / 114;

            const startIdx = Math.max(0, Math.floor(Math.min(topRow, bottomRow)) - 10);
            const endIdx = Math.min(stages.length, Math.ceil(Math.max(topRow, bottomRow)) + 15);

            return [startIdx, endIdx];
        },
        (next, prev) => {
            if (!prev || next[0] !== prev[0] || next[1] !== prev[1]) {
                runOnJS(setVisibleRange)({ start: next[0], end: next[1] });
            }
        },
        [stageLayouts.totalHeight, stages.length, viewportHeight]
    );

    // Scroll to Level 1 (bottom) on layout/mount
    const handleInitialScroll = () => {
        // Use a small delay to ensure content is measured and layout is ready
        setTimeout(() => {
            const currentLayout = stageLayouts.layouts[currentNodeId];
            if (currentLayout) {
                // Center the current node vertically in the viewport
                // We offset by (screenHeight / 2) and add back half the node distance (57) for centering
                const centeredY = currentLayout.top - (screenHeight / 2) + 57;
                mapRef.current?.scrollTo({ y: Math.max(0, centeredY), animated: true });
            } else {
                // Fallback to start of the path (bottom of ScrollView)
                mapRef.current?.scrollToEnd({ animated: true });
            }
        }, 150);
    };

    React.useEffect(() => {
        handleInitialScroll();
    }, []);

    const handleStagePress = (stageId: number) => {
        setSelectedStage(stageId);
        setStageModalVisible(true);
    };

    const handlePlayStage = () => {
        if (selectedStage) {
            setStageModalVisible(false);
            const stageData = stages.find(s => s.id === selectedStage);

            // Only advance the "frontier" if they are playing the latest unlocked node
            if (selectedStage === currentNodeId) {
                advanceToNode(selectedStage);
            }

            if (stageData?.type === 'shop') {
                setStageModalVisible(false);
                advanceToNode(selectedStage);
                navigation.navigate('Shop');
                return;
            }

            if (stageData?.type === 'event' || stageData?.type === 'rest') {
                setStageModalVisible(false);
                navigation.navigate('Event', { stageId: selectedStage });
                return;
            }

            navigation.navigate('GameBoard', {
                difficulty: stageData?.difficulty || selectedDifficulty,
                stageId: selectedStage
            });
        }
    };

    return (
        <View style={styles.container}>
            <CampaignMapSkiaBackground scrollY={scrollY} totalHeight={stageLayouts.totalHeight} />
            <MapParallaxLayers scrollY={scrollY} totalHeight={stageLayouts.totalHeight} />

            {/* Scrollable Map */}
            <Animated.ScrollView
                ref={mapRef as any}
                contentContainerStyle={[styles.mapContent, { height: stageLayouts.totalHeight }]}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                <View style={[styles.roadContainer, { width: screenWidth, height: stageLayouts.totalHeight }]}>
                    {stages.slice(visibleRange.start, visibleRange.end).map((stage) => {
                        const isBoss = stage.id % 20 === 0;
                        const layout = stageLayouts.layouts[stage.id];
                        if (!layout) return null;

                        return (
                            <MapNodeComponent
                                key={stage.id}
                                stage={stage}
                                isBoss={isBoss}
                                layout={layout}
                                isActive={selectedStage === stage.id}
                                isCurrent={currentNodeId === stage.id}
                                isCompleted={completedNodes.includes(stage.id)}
                                isLocked={stage.id > currentNodeId}
                                onPress={() => {
                                    if (stage.id > currentNodeId) {
                                        return; // Locked!
                                    }
                                    handleStagePress(stage.id);
                                }}
                            />
                        );
                    })}
                </View>
            </Animated.ScrollView>

            {/* Map Header - Glassmorphism */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <ExpoLinearGradient
                    colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
                    style={StyleSheet.absoluteFill}
                />

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerPill}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.arcane.emerald} />
                    <Text variant="caption" color={colors.arcane.emerald} style={styles.pillText} numberOfLines={1}>{t('common.exit')}</Text>
                </TouchableOpacity>

                <BiomeHeader scrollY={scrollY} totalHeight={stageLayouts.totalHeight} />

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerPill}
                        onPress={() => navigation.navigate('Shop')}
                    >
                        <MaterialCommunityIcons name="cart" size={18} color="#FBBF24" />
                        <Text style={styles.currencyText}>{gold}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerPill}
                        onPress={() => navigation.navigate('TalentTree')}
                    >
                        <Ionicons name="sparkles" size={18} color={colors.arcane.emerald} />
                        {talentPoints > 0 && (
                            <View style={styles.pillBadge}>
                                <Text style={styles.pillBadgeText}>{talentPoints}</Text>
                            </View>
                        )}
                        <Text variant="caption" color={colors.arcane.emerald} style={styles.pillText} numberOfLines={1}>{t('common.ascend')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setDifficultyModalVisible(true)}
                        style={[styles.headerPill, { borderColor: colors.arcane.cyan }]}
                    >
                        <Text variant="caption" color={colors.arcane.cyan} style={styles.pillText} numberOfLines={1}>
                            {t(`campaign.difficulty.${selectedDifficulty}`).toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Relic Tray Overlay */}
            <View style={[styles.relicTrayWrapper, { top: insets.top + 75 }]}>
                <RelicTray />
            </View>

            {/* Difficulty Selection Modal */}
            <Modal
                transparent
                visible={difficultyModalVisible}
                animationType="none"
                onRequestClose={() => setDifficultyModalVisible(false)}
            >
                <Animated.View
                    entering={FadeIn.duration(400)}
                    exiting={FadeOut.duration(200)}
                    style={styles.modalBackdropWrapper}
                >
                    <BlurView intensity={30} tint="dark" style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDifficultyModalVisible(false)} />
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            exiting={FadeOut.duration(200)}
                            style={[styles.difficultyModalContainer, { width: screenWidth * 0.85, maxHeight: screenHeight * 0.7 }]}
                        >
                            <ExpoLinearGradient colors={['rgba(30, 30, 60, 0.98)', 'rgba(10, 10, 20, 0.98)']} style={styles.difficultyGradient}>
                                <Text style={styles.difficultyHeader}>{t('campaign.select_difficulty')}</Text>
                                <View style={styles.difficultyList}>
                                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                                        const isActive = selectedDifficulty === diff;
                                        return (
                                            <TouchableOpacity
                                                key={diff}
                                                style={[
                                                    styles.difficultyItem,
                                                    isActive && styles.difficultyItemActive
                                                ]}
                                                onPress={() => {
                                                    setDifficulty(diff);
                                                    setDifficultyModalVisible(false);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.difficultyIconWrapper}>
                                                    {diff === 'easy' && <Ionicons name="leaf-outline" size={18} color={isActive ? colors.arcane.emerald : 'rgba(255,255,255,0.4)'} />}
                                                    {diff === 'medium' && <MaterialCommunityIcons name="shield-outline" size={18} color={isActive ? colors.arcane.emerald : 'rgba(255,255,255,0.4)'} />}
                                                    {diff === 'hard' && <MaterialCommunityIcons name="skull-outline" size={18} color={isActive ? colors.arcane.emerald : 'rgba(255,255,255,0.4)'} />}
                                                </View>
                                                <Text style={[styles.difficultyLabel, isActive && styles.difficultyLabelActive]}>
                                                    {t(`campaign.difficulty.${diff}`)}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ExpoLinearGradient>
                        </Animated.View>
                    </BlurView>
                </Animated.View>
            </Modal>

            {/* Stage Selection Overlay (Mission Briefing) */}
            <Modal
                transparent
                visible={stageModalVisible}
                animationType="none"
                onRequestClose={() => setStageModalVisible(false)}
            >
                <Animated.View
                    entering={FadeIn.duration(400)}
                    exiting={FadeOut.duration(200)}
                    style={styles.modalBackdropWrapper}
                >
                    <BlurView intensity={50} tint="dark" style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setStageModalVisible(false)} />
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            exiting={FadeOut.duration(200)}
                            style={[styles.stagePortalContainer, { width: screenWidth * 0.88, height: screenHeight * 0.8 }]}
                        >
                            <View style={styles.stagePortalHeader}>
                                <Text style={styles.stageLevelName}>
                                    {(() => {
                                        const type = stages.find(s => s.id === selectedStage)?.type;
                                        if (type === 'boss') return t('common.boss', { num: selectedStage });
                                        if (type === 'elite') return t('common.elite', { num: selectedStage });
                                        if (type === 'shop') return t('common.merchant', { num: selectedStage });
                                        return t('common.stage', { num: selectedStage });
                                    })()}
                                </Text>
                                <TouchableOpacity onPress={() => setStageModalVisible(false)} style={styles.closePortal}>
                                    <Ionicons name="close" size={24} color="rgba(255,255,255,0.4)" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.stagePortalBody}>
                                <View style={styles.stageInfoRow}>
                                    <View style={styles.stageLevelPill}>
                                        <Text style={styles.stageLevelText}>
                                            {t('common.level', { num: selectedStage })}
                                        </Text>
                                    </View>
                                    <View style={[styles.stageLevelPill, { borderColor: colors.arcane.cyan }]}>
                                        <Text style={[styles.stageLevelText, { color: colors.arcane.cyan }]}>
                                            {t(`campaign.difficulty.${selectedDifficulty}`)}
                                        </Text>
                                    </View>
                                    {selectedStage !== null && completedNodes.includes(selectedStage) && (
                                        <View style={[styles.stageLevelPill, { borderColor: colors.arcane.emerald, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                            <Text style={[styles.stageLevelText, { color: colors.arcane.emerald }]}>
                                                {t('common.completed')}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.stageArtContainer}>
                                    <View style={styles.stageArtGlow} />
                                    <View style={styles.stageIconMain}>
                                        {(() => {
                                            const type = stages.find(s => s.id === selectedStage)?.type;
                                            if (type === 'boss') return <MaterialCommunityIcons name="skull" size={24} color="#f59e0b" />;
                                            if (type === 'elite') return <MaterialCommunityIcons name="star-shooting" size={24} color={colors.arcane.emerald} />;
                                            if (type === 'shop') return <MaterialCommunityIcons name="diamond-stone" size={24} color="#fbbf24" />;
                                            if (type === 'event') return <MaterialCommunityIcons name="map-marker-question" size={24} color="#a855f7" />;
                                            if (type === 'rest') return <MaterialCommunityIcons name="tent" size={24} color="#2dd4bf" />;
                                            return <MaterialCommunityIcons name="shield-sword" size={24} color={colors.arcane.emerald} />;
                                        })()}
                                    </View>
                                </View>

                                <Text style={styles.stageDesc}>
                                    {(() => {
                                        const type = stages.find(s => s.id === selectedStage)?.type;
                                        if (type === 'boss') return t('campaign.descriptions.boss');
                                        if (type === 'shop') return t('campaign.descriptions.shop');
                                        if (type === 'event') return t('campaign.descriptions.event');
                                        return t('campaign.descriptions.battle');
                                    })()}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.portalAction}
                                onPress={handlePlayStage}
                                activeOpacity={0.8}
                            >
                                <ExpoLinearGradient
                                    colors={[colors.arcane.emerald, colors.arcane.emeraldDark]}
                                    style={styles.portalActionGradient}
                                >
                                    <Text style={styles.portalActionText}>
                                        {selectedStage !== null && completedNodes.includes(selectedStage) 
                                            ? t('common.replay').toUpperCase() 
                                            : (stages.find(s => s.id === selectedStage)?.type === 'shop' ? t('common.visit_merchant') : t('common.enter_void'))}
                                    </Text>
                                </ExpoLinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </BlurView>
                </Animated.View>
            </Modal>

            {/* Lore Chronicles Button */}
            <Animated.View 
                entering={FadeIn.delay(1000)}
                style={[styles.loreButtonContainer, { bottom: insets.bottom + 20 }]}
            >
                <TouchableOpacity 
                    style={styles.loreButton}
                    onPress={() => navigation.navigate('Lore')}
                    activeOpacity={0.8}
                >
                    <ExpoLinearGradient 
                        colors={['rgba(16, 185, 129, 0.2)', 'rgba(0, 0, 0, 0.4)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <MaterialCommunityIcons name="book-open-variant" size={26} color={colors.arcane.emerald} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const BiomeHeader: React.FC<{ scrollY: SharedValue<number>, totalHeight: number }> = ({ scrollY, totalHeight }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');

    const updateBiomeName = (biomeId: string) => {
        setName(t(`biome.${biomeId}`).toUpperCase());
    };

    useAnimatedReaction(
        () => {
            if (!totalHeight) return '';
            const maxTop = totalHeight - 200;
            const logicScroll = Math.max(0, maxTop - scrollY.value);
            // Each stage is roughly 114px plus some offset
            const stage = Math.floor(logicScroll / 114) + 1;
            const biome = MAP_BIOMES.find(b => stage >= b.start && stage <= b.end);
            return biome ? biome.id : MAP_BIOMES[0].id;
        },
        (next, prev) => {
            if (next !== prev && next) {
                runOnJS(updateBiomeName)(next);
            }
        },
        [totalHeight]
    );

    const animatedStyle = useAnimatedStyle(() => {
        if (!totalHeight) return { opacity: 0 };
        const maxTop = totalHeight - 200;
        const biomeHeight = maxTop / 5;
        if (biomeHeight <= 0) return { opacity: 1 };

        const logicScroll = Math.max(0, maxTop - scrollY.value);
        const progress = logicScroll % biomeHeight;
        return {
            opacity: interpolate(
                progress,
                [0, 100, biomeHeight - 100, biomeHeight],
                [0, 1, 1, 0]
            ),
            transform: [
                { translateY: interpolate(progress, [0, 100], [10, 0], 'clamp') }
            ]
        };
    }, [totalHeight]);

    return (
        <Animated.View style={[styles.biomeHeaderContainer, animatedStyle]}>
            <Text style={styles.biomeHeaderText}>{name}</Text>
            <View style={styles.biomeHeaderLine} />
        </Animated.View>
    );
};

const MapNodeComponent = React.memo<{
    stage: MapNodeTypeData;
    isBoss: boolean;
    layout: { top: number; left: number };
    isActive: boolean;
    isCurrent: boolean;
    isCompleted: boolean;
    isLocked: boolean;
    onPress: (id: number) => void;
}>(({ stage, isBoss, layout, isActive, isCurrent, isCompleted, isLocked, onPress }) => {
    const NODE_SIZE = isBoss ? 70 : 54;
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        if (isCurrent || isActive) {
            pulse.value = withRepeat(
                withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            pulse.value = 1;
        }
    }, [isActive, isCurrent]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: -NODE_SIZE / 2 },
            { scale: pulse.value }
        ]
    }));

    const getIcon = () => {
        const color = isLocked ? colors.text.disabled : (isCurrent || isActive ? colors.arcane.obsidian : isBoss ? colors.arcane.white : colors.arcane.emerald);
        const size = isBoss ? 28 : 20;

        if (stage.type === 'shop') return <MaterialCommunityIcons name="diamond-stone" size={size} color={color} />;
        if (stage.type === 'rest') return <MaterialCommunityIcons name="tent" size={size} color={color} />;
        if (stage.type === 'event') return <MaterialCommunityIcons name="map-marker-question" size={size} color={color} />;
        if (stage.type === 'elite') return <MaterialCommunityIcons name="star-shooting" size={size} color={color} />;
        if (stage.type === 'boss') return <MaterialCommunityIcons name="skull" size={size} color={color} />;
        return <MaterialCommunityIcons name="shield-sword" size={size} color={color} />;
    };

    return (
        <AnimatedPressable
            style={[
                styles.stageNode,
                {
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    position: 'absolute',
                    top: layout.top,
                    left: layout.left,
                    zIndex: isBoss ? 5 : 2,
                    opacity: isLocked ? 0.4 : 1,
                },
                animatedStyle
            ]}
            onPress={() => onPress(stage.id)}
        >
            <Animated.View style={[
                styles.nodeGlow,
                isBoss && styles.nodeGlowBoss,
                stage.type === 'shop' && !isLocked && styles.nodeGlowShop,
                stage.type === 'event' && !isLocked && styles.nodeGlowEvent,
                stage.type === 'rest' && !isLocked && styles.nodeGlowRest,
                isCurrent && styles.nodeGlowCurrent,
                isActive && styles.nodeGlowActive,
                { width: NODE_SIZE + 20, height: NODE_SIZE + 20, borderRadius: (NODE_SIZE + 20) / 2 }
            ]} />

            {isBoss && <View style={styles.bossRing} />}

            <ExpoLinearGradient
                colors={
                    isCurrent || isActive
                        ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                        : isBoss && !isLocked
                            ? ['#f59e0b', '#78350f']
                            : stage.type === 'shop' && !isLocked
                                ? ['#fbbf24', '#92400e']
                                : stage.type === 'event' && !isLocked
                                    ? ['#a855f7', '#581c87']
                                    : stage.type === 'rest' && !isLocked
                                        ? ['#2dd4bf', '#0d9488']
                                        : [colors.arcane.obsidian, 'rgba(20,20,20,0.8)']
                }
                style={[
                    styles.nodeSigil,
                    { width: NODE_SIZE - 4, height: NODE_SIZE - 4 },
                    isActive && styles.nodeSigilActive,
                    isBoss && styles.nodeSigilBoss,
                    stage.type === 'shop' && !isLocked && styles.nodeSigilShop,
                    stage.type === 'event' && !isLocked && styles.nodeSigilEvent,
                ]}
            >
                <View style={[styles.nodeIconWrapper, { transform: [{ rotate: '-45deg' }] }]}>
                    {getIcon()}
                </View>
            </ExpoLinearGradient>
            {isCompleted && (
                <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.arcane.emerald} />
                </View>
            )}
        </AnimatedPressable>
    );
});

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        zIndex: 20,
        paddingBottom: spacing.sm,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginLeft: spacing.sm,
        flexShrink: 0,
    },
    pillText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.arcane.white,
        marginLeft: 6,
        letterSpacing: 1,
    },
    currencyText: {
        color: '#FBBF24',
        fontWeight: '900',
        marginLeft: 6,
        fontSize: 12,
    },
    pillBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.arcane.emerald,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillBadgeText: {
        color: colors.arcane.obsidian,
        fontSize: 10,
        fontWeight: 'bold',
    },
    biomeHeaderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    biomeHeaderText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 3,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 10,
    },
    biomeHeaderLine: {
        height: 1,
        width: 30,
        backgroundColor: colors.arcane.emerald,
        marginTop: 4,
        opacity: 0.6,
    },
    mapContent: {
        paddingTop: 120,
        paddingBottom: 200,
    },
    roadContainer: {
        width: '100%',
    },
    stageNode: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    nodeSigil: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        transform: [{ rotate: '45deg' }],
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        ...shadows.md,
    },
    nodeSigilActive: {
        borderColor: '#fff',
        borderWidth: 2,
    },
    nodeSigilBoss: {
        borderColor: '#f59e0b',
        borderWidth: 2,
    },
    nodeSigilShop: {
        borderColor: '#fbbf24',
        borderWidth: 1.5,
    },
    nodeSigilEvent: {
        borderColor: '#a855f7',
        borderWidth: 1.5,
    },
    nodeIconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    nodeGlow: {
        position: 'absolute',
        backgroundColor: colors.arcane.emerald,
        opacity: 0,
    },
    nodeGlowCurrent: {
        opacity: 0.15,
        backgroundColor: colors.arcane.emerald,
    },
    nodeGlowActive: {
        opacity: 0.3,
        transform: [{ scale: 1.3 }],
    },
    nodeGlowBoss: {
        backgroundColor: '#f59e0b',
        opacity: 0.25,
    },
    nodeGlowShop: {
        backgroundColor: '#fbbf24',
        opacity: 0.2,
    },
    nodeGlowEvent: {
        backgroundColor: '#a855f7',
        opacity: 0.2,
    },
    nodeGlowRest: {
        backgroundColor: '#2dd4bf',
        opacity: 0.2,
    },
    bossRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.4)',
        borderStyle: 'dashed',
    },
    modalBackdropWrapper: {
        flex: 1,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    difficultyModalContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...shadows.lg,
    },
    difficultyHeader: {
        fontSize: 16,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 4,
        marginBottom: spacing.xl,
        fontFamily: 'serif',
    },
    difficultyGradient: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    completedBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.arcane.obsidian,
        borderRadius: 10,
        zIndex: 10,
    },
    difficultyList: {
        flexDirection: 'row',
        width: '100%',
        gap: spacing.xs,
    },
    relicTrayWrapper: {
        position: 'absolute',
        left: spacing.xl,
        right: spacing.xl,
        zIndex: 15,
    },
    difficultyItem: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    difficultyItemActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: colors.arcane.emerald,
    },
    difficultyIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    difficultyLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
        textAlign: 'center',
    },
    difficultyLabelActive: {
        color: colors.arcane.white,
    },
    activeCheck: {
        marginLeft: spacing.sm,
    },
    stagePortalContainer: {
        backgroundColor: colors.arcane.obsidian,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        ...shadows.xl,
    },
    stagePortalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16, 185, 129, 0.1)',
    },
    stageLevelName: {
        color: colors.arcane.white,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 3,
        fontFamily: 'serif',
    },
    closePortal: {
        padding: 4,
    },
    stagePortalBody: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
    },
    stageInfoRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    stageLevelPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    stageLevelText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 1,
    },
    stageArtContainer: {
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        marginBottom: spacing.lg,
    },
    stageArtGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.1,
    },
    stageIconMain: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stageDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: spacing.md,
    },
    portalAction: {
        width: '100%',
        height: 48,
    },
    portalActionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    portalActionText: {
        color: colors.arcane.obsidian,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 4,
    },
    // --- Lore Button ---
    loreButtonContainer: {
        position: 'absolute',
        right: 20,
        zIndex: 100,
    },
    loreButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
});
