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
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { CampaignMapSkiaBackground } from './components/CampaignMapSkiaBackground';
import { MapParallaxLayers } from './components/MapParallaxLayers';
import { TOTAL_STAGES, MAP_BIOMES } from './constants';
import { generateCampaignMap, MapNode as MapNodeTypeData } from '../../data/campaignData';
import { useCampaignStore } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';

type CampaignMapNavigationProp = StackNavigationProp<RootStackParamList, 'CampaignMap'>;

interface Props {
    navigation: CampaignMapNavigationProp;
}

export const CampaignMapScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const mapRef = React.useRef<ScrollView>(null);
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
    const [difficultyModalVisible, setDifficultyModalVisible] = useState(false);
    const [selectedStage, setSelectedStage] = useState<number | null>(null);
    const [stageModalVisible, setStageModalVisible] = useState(false);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 }); // Initial window

    // Use deterministic generation
    const stages = useMemo(() => generateCampaignMap(TOTAL_STAGES), []);

    // Campaign State
    const { currentNodeId, completedNodes, advanceToNode, gold, talentPoints } = useCampaignStore();

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
        () => scrollY.value,
        (currentScroll) => {
            if (!stageLayouts.totalHeight) return;
            const maxTop = stageLayouts.totalHeight - 200;

            // Inverted logic: Level 1 is at scrollY = maxTop
            const topRow = (maxTop - currentScroll) / 114;
            const bottomRow = (maxTop - (currentScroll + viewportHeight)) / 114;

            const startIdx = Math.max(0, Math.floor(Math.min(topRow, bottomRow)) - 10);
            const endIdx = Math.min(stages.length, Math.ceil(Math.max(topRow, bottomRow)) + 15);

            runOnJS(setVisibleRange)({ start: startIdx, end: endIdx });
        },
        [stageLayouts.totalHeight, stages.length, viewportHeight]
    );

    // Scroll to Level 1 (bottom) on layout/mount
    const handleInitialScroll = () => {
        // Use a small delay to ensure content is measured
        setTimeout(() => {
            mapRef.current?.scrollToEnd({ animated: true });
        }, 100);
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

            // Actually advance the node in the store when they press play
            // In a real flow, this might happen AFTER winning.
            advanceToNode(selectedStage);

            if (stageData?.type === 'shop') {
                setStageModalVisible(false);
                advanceToNode(selectedStage);
                navigation.navigate('Shop');
                return;
            }

            if (stageData?.type === 'event' || stageData?.type === 'rest') {
                // Placeholder for non-battle nodes
                console.log(`Entered ${stageData.type} node`);
                advanceToNode(selectedStage);
                setStageModalVisible(false);
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
                    <Text variant="caption" color={colors.arcane.emerald} style={styles.pillText}>EXIT</Text>
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
                        <Text variant="caption" color={colors.arcane.emerald} style={styles.pillText}>ASCEND</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setDifficultyModalVisible(true)}
                        style={[styles.headerPill, { borderColor: colors.arcane.cyan }]}
                    >
                        <Text variant="caption" color={colors.arcane.cyan} style={styles.pillText}>{selectedDifficulty.toUpperCase()}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals */}
            <Modal
                transparent
                visible={difficultyModalVisible}
                animationType="none"
                onRequestClose={() => setDifficultyModalVisible(false)}
            >
                <Animated.View entering={FadeIn.duration(200)} style={styles.modalBackdropWrapper}>
                    <BlurView intensity={40} tint="dark" style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDifficultyModalVisible(false)} />
                        <Animated.View
                            entering={SlideInDown.springify().damping(20)}
                            style={styles.modalContent}
                        >
                            <ExpoLinearGradient colors={['rgba(20, 20, 40, 0.95)', 'rgba(0,0,0,0.95)']} style={styles.modalOptionGradient}>
                                <Text style={styles.modalHead}>SELECT DIFFICULTY</Text>
                                <View style={styles.difficultyGrid}>
                                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                                        <TouchableOpacity
                                            key={diff}
                                            style={[
                                                styles.modalOption,
                                                selectedDifficulty === diff && styles.modalOptionActive
                                            ]}
                                            onPress={() => {
                                                setSelectedDifficulty(diff);
                                                setDifficultyModalVisible(false);
                                            }}
                                        >
                                            <Text
                                                variant="body"
                                                color={selectedDifficulty === diff ? colors.arcane.obsidian : colors.arcane.white}
                                                style={styles.diffOptionText}
                                            >
                                                {diff.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ExpoLinearGradient>
                        </Animated.View>
                    </BlurView>
                </Animated.View>
            </Modal>

            {/* Stage Preview Modal */}
            <Modal
                transparent
                visible={stageModalVisible}
                animationType="none"
                onRequestClose={() => setStageModalVisible(false)}
            >
                <Animated.View entering={FadeIn.duration(200)} style={styles.modalBackdropWrapper}>
                    <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setStageModalVisible(false)} />
                        <Animated.View
                            entering={FadeInUp.springify()}
                            style={styles.stageModalContent}
                        >
                            <ExpoLinearGradient colors={['rgba(16, 185, 129, 0.1)', 'rgba(0,0,0,0.85)']} style={styles.stageModalGradient}>
                                <Text style={styles.stageLevelName}>
                                    {stages.find(s => s.id === selectedStage)?.type?.toUpperCase() || 'LEVEL'} {selectedStage}
                                </Text>
                                <Text variant="caption" color={colors.arcane.emerald} style={styles.stagePortalSub}>
                                    {stages.find(s => s.id === selectedStage)?.type === 'shop'
                                        ? 'RESTOCK AND REFINE'
                                        : `DIFFICULTY: ${selectedDifficulty.toUpperCase()}`}
                                </Text>

                                <TouchableOpacity
                                    style={styles.playButton}
                                    onPress={handlePlayStage}
                                    activeOpacity={0.8}
                                >
                                    <ExpoLinearGradient
                                        colors={[colors.arcane.emerald, colors.arcane.emeraldDark]}
                                        style={styles.playButtonGradient}
                                    >
                                        <Text style={styles.playButtonText}>
                                            {stages.find(s => s.id === selectedStage)?.type === 'shop' ? 'VISIT MERCHANT' : 'ENTER VOID'}
                                        </Text>
                                    </ExpoLinearGradient>
                                </TouchableOpacity>
                            </ExpoLinearGradient>
                        </Animated.View>
                    </BlurView>
                </Animated.View>
            </Modal>
        </View>
    );
};

const BiomeHeader: React.FC<{ scrollY: SharedValue<number>, totalHeight: number }> = ({ scrollY, totalHeight }) => {
    const [name, setName] = useState(MAP_BIOMES[0].name.toUpperCase());

    useAnimatedReaction(
        () => {
            if (!totalHeight) return MAP_BIOMES[0].name.toUpperCase();
            const maxTop = totalHeight - 200;
            const logicScroll = Math.max(0, maxTop - scrollY.value);
            const stage = Math.floor((logicScroll / Math.max(1, maxTop)) * 200);
            const biome = MAP_BIOMES.find(b => stage >= b.start && stage <= b.end);
            return biome ? biome.name.toUpperCase() : MAP_BIOMES[0].name.toUpperCase();
        },
        (next, prev) => {
            if (next !== prev) {
                runOnJS(setName)(next);
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
                            : [colors.arcane.obsidian, 'rgba(20,20,20,0.8)']
                }
                style={[
                    styles.nodeSigil,
                    { width: NODE_SIZE - 4, height: NODE_SIZE - 4 },
                    isActive && styles.nodeSigilActive,
                    isBoss && styles.nodeSigilBoss
                ]}
            >
                <View style={[styles.nodeIconWrapper, { transform: [{ rotate: '-45deg' }] }]}>
                    {getIcon()}
                </View>
            </ExpoLinearGradient>
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
    },
    pillText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.arcane.white,
        marginLeft: 6,
        letterSpacing: 2,
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
    modalContent: {
        width: width * 0.7,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...shadows.lg,
    },
    modalOptionGradient: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalHead: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 3,
        marginBottom: spacing.xl,
    },
    difficultyGrid: {
        width: '100%',
    },
    modalOption: {
        width: '100%',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: spacing.sm,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modalOptionActive: {
        backgroundColor: colors.arcane.emerald,
        borderColor: colors.arcane.emerald,
    },
    diffOptionText: {
        fontWeight: '900',
        letterSpacing: 2,
    },
    stageModalContent: {
        width: width * 0.8,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.arcane.emerald,
        ...shadows.lg,
    },
    stageModalGradient: {
        padding: spacing['2xl'],
        alignItems: 'center',
    },
    stageLevelName: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 5,
        marginBottom: spacing.xs,
    },
    stagePortalSub: {
        fontSize: 12,
        letterSpacing: 3,
        marginBottom: spacing['2xl'],
        opacity: 0.6,
    },
    playButton: {
        width: '100%',
        height: 56,
        borderRadius: 14,
        overflow: 'hidden',
    },
    playButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonText: {
        color: colors.arcane.obsidian,
        fontWeight: '900',
        letterSpacing: 3,
        fontSize: 18,
    }
});
