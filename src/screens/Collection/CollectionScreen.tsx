import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList, useWindowDimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withDelay,
    interpolate
} from 'react-native-reanimated';
import { RootStackParamList, Card, CardType } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getCardDimensions, getLayoutDimensions } from '../../theme';
import { getAllCards } from '../../data/cardData';
import { useDeckStore } from '../../store/deckStore';

type CollectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Collection'>;

interface Props {
    navigation: CollectionScreenNavigationProp;
}

const ALL_CARDS = getAllCards();

const AnimatedBackground: React.FC = () => {
    const orb1Pos = useSharedValue(0);
    const orb2Pos = useSharedValue(0);

    React.useEffect(() => {
        orb1Pos.value = withRepeat(withTiming(1, { duration: 10000 }), -1, true);
        orb2Pos.value = withRepeat(withTiming(1, { duration: 8000 }), -1, true);
    }, []);

    const orb1Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(orb1Pos.value, [0, 1], [-50, 50]) },
            { translateY: interpolate(orb1Pos.value, [0, 1], [-20, 20]) },
        ],
    }));

    const orb2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(orb2Pos.value, [0, 1], [30, -30]) },
            { translateY: interpolate(orb2Pos.value, [0, 1], [50, -50]) },
        ],
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.glowOrb, styles.orb1, orb1Style]} />
            <Animated.View style={[styles.glowOrb, styles.orb2, orb2Style]} />
        </View>
    );
};

export const CollectionScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { decks } = useDeckStore();

    const [selectedCategory, setSelectedCategory] = useState<'all' | CardType>('all');

    const layout = getLayoutDimensions(screenWidth, screenHeight);
    const cardDims = getCardDimensions(screenWidth, screenHeight);

    const cardWidth = cardDims.width * 1.1; // Slightly larger for collection
    const cardHeight = cardDims.height * 1.1;

    const categories: { id: 'all' | CardType; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'unit', label: 'Units' },
        { id: 'spell', label: 'Spells' },
        { id: 'weather', label: 'Weather' },
    ];

    const filteredCards = useMemo(() => {
        if (selectedCategory === 'all') return ALL_CARDS;
        return ALL_CARDS.filter(card => card.type === selectedCategory);
    }, [selectedCategory]);

    const numColumns = Math.floor((screenWidth - layout.contentPadding * 2) / (cardWidth + 16));

    return (
        <View style={styles.container}>
            <AnimatedBackground />

            <View style={[
                styles.content,
                {
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                }
            ]}>
                {/* Header */}
                <Animated.View
                    entering={SlideInLeft.duration(600).springify()}
                    style={[styles.header, { paddingHorizontal: layout.contentPadding, paddingTop: spacing.sm }]}
                >
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text variant="body" color={colors.primary[400]} style={styles.backText}>← MENU</Text>
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text variant="h2" style={styles.title}>COLLECTION</Text>
                        <View style={styles.titleUnderline} />
                    </View>
                    <View style={styles.backButton} />
                </Animated.View>

                {/* Categories & Stats Row */}
                <View style={[styles.metaRow, { paddingHorizontal: layout.contentPadding }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {categories.map((cat, idx) => (
                            <Animated.View key={cat.id} entering={FadeIn.delay(300 + idx * 50)}>
                                <Pressable
                                    onPress={() => setSelectedCategory(cat.id)}
                                    style={[
                                        styles.categoryBtn,
                                        selectedCategory === cat.id && styles.categoryBtnActive
                                    ]}
                                >
                                    <Text
                                        variant="caption"
                                        color={selectedCategory === cat.id ? colors.background.primary : colors.text.secondary}
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        {cat.label.toUpperCase()}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        ))}
                    </ScrollView>

                    <Animated.View entering={FadeIn.delay(500)} style={styles.statsGlass}>
                        <View style={styles.statItem}>
                            <Text variant="h4" color={colors.secondary[400]}>{ALL_CARDS.length}</Text>
                            <Text variant="caption" color={colors.text.tertiary}>CARDS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text variant="h4" color={colors.primary[400]}>{decks.length}</Text>
                            <Text variant="caption" color={colors.text.tertiary}>DECKS</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* Cards grid */}
                <FlatList
                    data={filteredCards}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    key={`grid-${numColumns}`}
                    contentContainerStyle={{
                        paddingHorizontal: layout.contentPadding,
                        paddingBottom: spacing.xl,
                        paddingTop: spacing.md
                    }}
                    columnWrapperStyle={{
                        justifyContent: 'flex-start',
                        gap: 16,
                        marginBottom: 16
                    }}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeIn.delay(idxToDelay(index))}>
                            <CardComponent
                                card={item}
                                width={cardWidth}
                                height={cardHeight}
                                isPlayable={false}
                                onPress={() => { }}
                            />
                        </Animated.View>
                    )}
                />
            </View>
        </View>
    );
};

const idxToDelay = (index: number) => Math.min(index * 30, 1000);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    glowOrb: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.15,
        filter: 'blur(60px)',
    },
    orb1: {
        backgroundColor: colors.primary[500],
        top: -100,
        left: -100,
    },
    orb2: {
        backgroundColor: colors.secondary[500],
        bottom: -150,
        right: -100,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    backButton: {
        minWidth: 80,
    },
    backText: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        color: colors.text.primary,
        letterSpacing: 2,
    },
    titleUnderline: {
        width: 40,
        height: 2,
        backgroundColor: colors.secondary[400],
        marginTop: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    categoryScroll: {
        gap: spacing.xs,
        paddingRight: spacing.md,
    },
    categoryBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: spacing.xs,
    },
    categoryBtnActive: {
        backgroundColor: colors.secondary[400],
        borderColor: colors.secondary[300],
    },
    statsGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20,20,32,0.8)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statItem: {
        alignItems: 'center',
        minWidth: 60,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: spacing.sm,
    },
});
