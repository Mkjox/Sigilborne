import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useCampaignStore } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import { colors, spacing, shadows, borderRadius, typography } from '../../theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useTranslation } from 'react-i18next';
import { getAllCards } from '../../data/cardData';
import { getRelicById } from '../../data/relicData';

// Local Assets
const voidRiftImg = require('../../../assets/events/void_rift.jpg');
const willowTreeImg = require('../../../assets/events/willow_tree.jpg');
const caravanWreckImg = require('../../../assets/events/caravan_wreck.jpg');

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Event'>;
type EventRouteProp = RouteProp<RootStackParamList, 'Event'>;

interface EventChoice {
    id: string;
    label: string;
    description: string;
    icon: string;
    iconType: 'Ionicons' | 'MaterialCommunityIcons';
    action: () => void;
}

export const EventScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<EventRouteProp>();
    const { t } = useTranslation();
    const { stageId } = route.params;
    const insets = useSafeAreaInsets();

    const { gold, advanceToNode, addRelic, completeNode, completedNodes } = useCampaignStore();
    const isAlreadyCompleted = useMemo(() => completedNodes.includes(stageId), [completedNodes, stageId]);
    const { getActiveDeck, addCardToDeck } = useDeckStore();
    const activeDeck = getActiveDeck();

    const [resolved, setResolved] = useState(false);
    const [resolutionText, setResolutionText] = useState('');

    // Pre-defined events based on stageId or random
    const eventData = useMemo(() => {
        // Deterministic but feels random
        const seed = stageId % 3;

        switch (seed) {
            case 0:
                return {
                    title: t('events.whispering_void.title'),
                    description: t('events.whispering_void.description'),
                    image: voidRiftImg,
                    choices: [
                        {
                            id: 'gift_gold',
                            label: t('events.whispering_void.choices.gift_gold_label'),
                            description: t('events.whispering_void.choices.gift_gold_desc'),
                            icon: 'cash',
                            iconType: 'Ionicons' as const,
                            action: () => {
                                completeNode(stageId, { gold: 50 });
                                setResolutionText(t('events.whispering_void.resolution.gold'));
                            }
                        },
                        {
                            id: 'gift_card',
                            label: t('events.whispering_void.choices.gift_card_label'),
                            description: t('events.whispering_void.choices.gift_card_desc'),
                            icon: 'card',
                            iconType: 'Ionicons' as const,
                            action: () => {
                                const allCards = getAllCards();
                                const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                                if (activeDeck) {
                                    addCardToDeck(activeDeck.id, randomCard);
                                }
                                completeNode(stageId);
                                const transName = t(`cards.${randomCard.name}`);
                                setResolutionText(t('events.whispering_void.resolution.card', { name: transName }));
                            }
                        }
                    ]
                };
            case 1:
                return {
                    title: t('events.weeping_willow.title'),
                    description: t('events.weeping_willow.description'),
                    image: willowTreeImg,
                    choices: [
                        {
                            id: 'offer_gold',
                            label: t('events.weeping_willow.choices.offer_gold_label'),
                            description: t('events.weeping_willow.choices.offer_gold_desc'),
                            icon: 'diamond',
                            iconType: 'Ionicons' as const,
                            action: () => {
                                if (gold < 25) {
                                    setResolutionText(t('events.weeping_willow.resolution.not_enough_gold'));
                                    return;
                                }
                                const relicId = Math.random() > 0.5 ? 'war_banner' : 'mana_crystal';
                                addRelic(relicId);
                                completeNode(stageId, { gold: -25 });
                                const relicName = t(`relics.${relicId}.name`);
                                setResolutionText(t('events.weeping_willow.resolution.success', { relic: relicName }));
                            }
                        },
                        {
                            id: 'ignore',
                            label: t('events.weeping_willow.choices.ignore_label'),
                            description: t('events.weeping_willow.choices.ignore_desc'),
                            icon: 'walk',
                            iconType: 'Ionicons' as const,
                            action: () => {
                                completeNode(stageId);
                                setResolutionText(t('events.weeping_willow.resolution.ignore'));
                            }
                        }
                    ]
                };
            default:
                return {
                    title: t('events.abandoned_caravan.title'),
                    description: t('events.abandoned_caravan.description'),
                    image: caravanWreckImg,
                    choices: [
                        {
                            id: 'scavenge',
                            label: t('events.abandoned_caravan.choices.scavenge_label'),
                            description: t('events.abandoned_caravan.choices.scavenge_desc'),
                            icon: 'search',
                            iconType: 'Ionicons' as const,
                            action: () => {
                                completeNode(stageId, { gold: 30 });
                                setResolutionText(t('events.abandoned_caravan.resolution.scavenge'));
                            }
                        },
                        {
                            id: 'search_carefully',
                            label: t('events.abandoned_caravan.choices.search_carefully_label'),
                            description: t('events.abandoned_caravan.choices.search_carefully_desc'),
                            icon: 'alert-circle',
                            iconType: 'Ionicons' as const,
                            action: () => {
                                if (Math.random() > 0.5) {
                                    completeNode(stageId, { gold: 60 });
                                    setResolutionText(t('events.abandoned_caravan.resolution.success'));
                                } else {
                                    completeNode(stageId);
                                    setResolutionText(t('events.abandoned_caravan.resolution.failed'));
                                }
                            }
                        }
                    ]
                };
        }
    }, [stageId, gold, activeDeck]);

    const handleChoice = (choice: EventChoice) => {
        choice.action();
        setResolved(true);
    };

    const handleContinue = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {/* Background Texture - Obsidian gradient and faded image */}
            <ExpoLinearGradient
                colors={[colors.arcane.obsidian, '#050505']}
                style={StyleSheet.absoluteFillObject}
            />
            <Image
                source={eventData.image}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]}
                resizeMode="cover"
            />
            {/* Additional gradient to ensure UI readability */}
            <ExpoLinearGradient
                colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Split Layout Container */}
            <View style={styles.splitContainer}>

                {/* Left Side: Narrative */}
                <Animated.View entering={FadeIn.duration(1000)} style={styles.leftPane}>
                    <View style={styles.narrativeContent}>
                        <Text style={styles.title}>{eventData.title.toUpperCase()}</Text>
                        <View style={styles.divider} />
                        <Text style={styles.description}>
                            {isAlreadyCompleted && !resolved 
                                ? t('events.already_completed_desc')
                                : (resolved ? resolutionText : eventData.description)}
                        </Text>
                    </View>
                </Animated.View>

                {/* Right Side: Choices */}
                <Animated.View entering={FadeInRight.duration(800).delay(200)} style={styles.rightPane}>
                    <View style={styles.choicesContainer}>
                        {!resolved && !isAlreadyCompleted ? (
                            eventData.choices.map((choice, index) => (
                                <Animated.View
                                    key={choice.id}
                                    entering={FadeInDown.delay(400 + index * 150)}
                                    style={styles.choiceWrapper}
                                >
                                    <TouchableOpacity
                                        style={styles.entryCard}
                                        onPress={() => handleChoice(choice)}
                                        activeOpacity={0.7}
                                    >
                                        <ExpoLinearGradient
                                            colors={['rgba(16,185,129,0.15)', 'transparent']}
                                            style={StyleSheet.absoluteFillObject}
                                        />

                                        {/* Icon */}
                                        <View style={styles.iconContainer}>
                                            {choice.iconType === 'Ionicons' ? (
                                                <Ionicons name={choice.icon as any} size={22} color={colors.arcane.emerald} />
                                            ) : (
                                                <MaterialCommunityIcons name={choice.icon as any} size={22} color={colors.arcane.emerald} />
                                            )}
                                        </View>

                                        {/* Text content */}
                                        <View style={styles.entryTextContent}>
                                            <Text style={styles.entryTitle}>{choice.label.toUpperCase()}</Text>
                                            <View style={styles.entryDivider} />
                                            <Text style={styles.entryContent}>{choice.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))
                        ) : (
                            <Animated.View entering={FadeInDown.duration(600)} style={{ width: '100%', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={handleContinue}
                                    activeOpacity={0.8}
                                >
                                    <ExpoLinearGradient
                                        colors={[colors.arcane.emerald, colors.arcane.emeraldDark]}
                                        style={styles.continueGradient}
                                    >
                                        <Text style={styles.continueText}>{isAlreadyCompleted ? t('common.back').toUpperCase() : t('events.continue_journey').toUpperCase()}</Text>
                                    </ExpoLinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>
            </View>

            {/* Header / Back */}
            {/* <View style={[styles.header, { top: insets.top + spacing.md, left: insets.left + spacing.xl }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={32} color={colors.arcane.emerald} />
                </TouchableOpacity>
            </View> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    splitContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: spacing['2xl'],
        alignItems: 'center',
    },
    leftPane: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: spacing.xl,
    },
    rightPane: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: spacing.xl,
    },
    header: {
        position: 'absolute',
        zIndex: 10,
    },
    backButton: {
        width: 40, height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    narrativeContent: {
        alignItems: 'center',
        maxWidth: 500,
        alignSelf: 'center',
    },
    title: {
        fontSize: 26,
        color: colors.arcane.white,
        fontFamily: 'serif',
        fontWeight: '900',
        letterSpacing: 8,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    divider: {
        height: 1,
        width: 60,
        backgroundColor: 'rgba(16,185,129,0.5)',
        marginBottom: spacing.xl,
    },
    description: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 16,
        lineHeight: 26,
        fontFamily: 'serif',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    choicesContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    choiceWrapper: {
        marginBottom: 16,
    },
    entryCard: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.12)',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderColor: colors.arcane.emerald,
        marginRight: 16,
        flexShrink: 0,
    },
    entryTextContent: {
        flex: 1,
        justifyContent: 'center',
    },
    entryTitle: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
        fontFamily: 'serif',
        color: colors.arcane.emerald,
    },
    entryDivider: {
        height: 1,
        width: 36,
        marginBottom: 10,
        backgroundColor: colors.arcane.emerald,
    },
    entryContent: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 21,
    },
    continueButton: {
        width: 250,
        height: 52,
        borderRadius: 8,
        overflow: 'hidden',
    },
    continueGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueText: {
        color: colors.arcane.obsidian,
        fontWeight: '900',
        letterSpacing: 3,
        fontSize: 14,
        fontFamily: 'serif',
    }
});
