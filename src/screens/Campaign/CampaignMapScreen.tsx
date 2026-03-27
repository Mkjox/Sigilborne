import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    useWindowDimensions,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeOut,
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
import { RootStackParamList, Difficulty } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { CampaignMapSkiaBackground } from './components/CampaignMapSkiaBackground';
import { MapParallaxLayers } from './components/MapParallaxLayers';
import { TOTAL_STAGES, MAP_BIOMES } from './constants';
import { generateCampaignMap, MapNode as MapNodeTypeData } from '../../data/campaignData';
import { useCampaignStore } from '../../store/campaignStore';

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

            {/* Map Header - Moved to bottom to ensure it's on top of ScrollView */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Text variant="body" color={colors.arcane.emerald}>← MENU</Text>
                </Pressable>

                <BiomeHeader scrollY={scrollY} totalHeight={stageLayouts.totalHeight} />

                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.heroButton}
                        onPress={() => navigation.navigate('Shop')}
                    >
                        <MaterialCommunityIcons name="cart" size={20} color={colors.arcane.emerald} />
                    </Pressable>

                    <Pressable
                        style={styles.heroButton}
                        onPress={() => navigation.navigate('TalentTree')}
                    >
                        <Ionicons name="sparkles" size={20} color={colors.arcane.emerald} />
                        {talentPoints > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{talentPoints}</Text>
                            </View>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={() => setDifficultyModalVisible(true)}
                        style={[styles.headerButton, styles.difficultyBtn]}
                    >
                        <Text variant="caption" color={colors.arcane.cyan}>{selectedDifficulty.toUpperCase()}</Text>
                    </Pressable>
                </View>
            </View>

            {/* Modals */}
            <Modal
                transparent
                visible={difficultyModalVisible}
                animationType="fade"
                onRequestClose={() => setDifficultyModalVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setDifficultyModalVisible(false)}>
                    <Animated.View
                        entering={SlideInDown}
                        exiting={SlideOutDown}
                        style={styles.modalContent}
                    >
                        <Text variant="h3" style={styles.modalTitle}>SELECT DIFFICULTY</Text>
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                            <Pressable
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
                                >
                                    {diff.toUpperCase()}
                                </Text>
                            </Pressable>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* Stage Preview Modal */}
            <Modal
                transparent
                visible={stageModalVisible}
                animationType="fade"
                onRequestClose={() => setStageModalVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setStageModalVisible(false)}>
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={styles.stageModalContent}
                    >
                        <Text variant="h3" style={styles.stageLevelName}>
                            {stages.find(s => s.id === selectedStage)?.type?.toUpperCase() || 'LEVEL'} {selectedStage}
                        </Text>
                        <Text variant="caption" color={colors.arcane.emerald} style={styles.stageInfo}>
                            {stages.find(s => s.id === selectedStage)?.type === 'shop'
                                ? 'RESTOCK AND REFINE'
                                : `DIFFICULTY: ${selectedDifficulty.toUpperCase()}`}
                        </Text>

                        <Pressable
                            style={styles.playButton}
                            onPress={handlePlayStage}
                        >
                            <LinearGradient
                                colors={[colors.arcane.emerald, colors.arcane.emeraldDark]}
                                style={styles.playButtonGradient}
                            >
                                <Text style={styles.playButtonText}>
                                    {stages.find(s => s.id === selectedStage)?.type === 'shop' ? 'VISIT MERCHANT' : 'ENTER VOID'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </Pressable>
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
            <View style={[
                styles.nodeGlow,
                isBoss && styles.nodeGlowBoss,
                isActive && styles.nodeGlowActive,
                isBoss && { width: NODE_SIZE + 10, height: NODE_SIZE + 10, borderRadius: (NODE_SIZE + 10) / 2 }
            ]} />

            {isBoss && <View style={styles.bossRing} />}

            <LinearGradient
                colors={
                    isCurrent || isActive
                        ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                        : isBoss && !isLocked
                            ? ['#f59e0b', '#78350f']
                            : [colors.arcane.graphite, colors.arcane.obsidian]
                }
                style={[
                    styles.nodeCircle,
                    { width: NODE_SIZE - 4, height: NODE_SIZE - 4, borderRadius: (NODE_SIZE - 4) / 2 },
                    isActive && styles.nodeCircleActive,
                    isBoss && styles.nodeCircleBoss
                ]}
            >
                <Text variant={isBoss ? "body" : "caption"} color={isActive ? colors.arcane.obsidian : isBoss ? colors.arcane.white : colors.arcane.emerald} style={styles.nodeText}>
                    {getIcon()}
                </Text>
            </LinearGradient>
        </AnimatedPressable>
    );
});

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingBottom: spacing.md,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerButton: {
        padding: spacing.sm,
        minWidth: 80,
    },
    difficultyBtn: {
        alignItems: 'flex-end',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        letterSpacing: 4,
        color: colors.arcane.white,
    },
    titleUnderline: {
        height: 2,
        width: 60,
        backgroundColor: colors.arcane.emerald,
        marginTop: 4,
        borderRadius: 1,
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
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    biomeHeaderLine: {
        height: 1.5,
        width: 40,
        backgroundColor: colors.arcane.emerald,
        marginTop: 4,
        borderRadius: 1,
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
    nodeCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.arcane.emerald,
        ...shadows.md,
    },
    nodeCircleActive: {
        borderColor: '#fff',
        borderWidth: 2,
        transform: [{ scale: 1.1 }],
    },
    nodeGlow: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.arcane.emerald,
        opacity: 0,
    },
    nodeGlowActive: {
        opacity: 0.2,
        transform: [{ scale: 1.2 }],
    },
    nodeGlowBoss: {
        backgroundColor: '#f59e0b',
        opacity: 0.3,
    },
    nodeCircleBoss: {
        borderColor: '#f59e0b',
        borderWidth: 2,
    },
    bossRing: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderStyle: 'dashed',
    },
    nodeText: {
        fontWeight: 'bold',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '65%', // Reduced by approx 20%
        backgroundColor: colors.arcane.obsidian,
        borderRadius: borderRadius.lg,
        padding: spacing.lg, // Reduced from xl
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        alignItems: 'center',
    },
    modalTitle: {
        marginBottom: spacing.lg, // Reduced from xl
        letterSpacing: 2,
    },
    modalOption: {
        width: '100%',
        padding: spacing.md, // Reduced from lg
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginBottom: spacing.sm, // Reduced from md
        alignItems: 'center',
    },
    modalOptionActive: {
        backgroundColor: colors.arcane.emerald,
        borderColor: colors.arcane.emerald,
    },
    stageModalContent: {
        width: '85%',
        backgroundColor: colors.arcane.obsidian,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
        borderWidth: 2,
        borderColor: colors.arcane.emerald,
        alignItems: 'center',
        ...shadows.lg,
    },
    stageLevelName: {
        letterSpacing: 4,
        marginBottom: spacing.xs,
    },
    stageInfo: {
        letterSpacing: 2,
        marginBottom: spacing['2xl'],
        opacity: 0.8,
    },
    playButton: {
        width: '100%',
        height: 60,
        borderRadius: borderRadius.md,
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
