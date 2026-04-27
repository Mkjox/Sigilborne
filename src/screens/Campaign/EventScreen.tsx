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
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
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
            {/* Background */}
            <ExpoLinearGradient
                colors={['#0f172a', '#1e1b4b', '#000000']}
                style={StyleSheet.absoluteFillObject}
            />

            <Animated.ScrollView 
                entering={FadeIn.duration(800)} 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Event Image / Visual */}
                <View style={styles.imageContainer}>
                    <Image source={eventData.image} style={styles.eventImage} resizeMode="cover" />
                    <ExpoLinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.imageOverlay}
                    />
                </View>

                {/* Narrative Section */}
                <View style={styles.narrativeContainer}>
                    <Text variant="h2" style={styles.title}>{eventData.title.toUpperCase()}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.description}>
                        {isAlreadyCompleted && !resolved 
                            ? "This place feels quiet. The echoes of your previous encounter still linger in the air, but the energies have dissipated. There is nothing more to be found here."
                            : (resolved ? resolutionText : eventData.description)}
                    </Text>
                </View>

                {/* Choices Section */}
                <View style={styles.choicesContainer}>
                    {!resolved && !isAlreadyCompleted ? (
                        eventData.choices.map((choice, index) => (
                            <Animated.View 
                                key={choice.id}
                                entering={FadeInDown.delay(400 + index * 100).springify()}
                            >
                                <TouchableOpacity
                                    style={styles.choiceButton}
                                    onPress={() => handleChoice(choice)}
                                    activeOpacity={0.8}
                                >
                                    <BlurView intensity={30} tint="light" style={styles.choiceBlur}>
                                        <View style={styles.choiceIconContainer}>
                                            {choice.iconType === 'Ionicons' ? (
                                                <Ionicons name={choice.icon as any} size={24} color={colors.arcane.emerald} />
                                            ) : (
                                                <MaterialCommunityIcons name={choice.icon as any} size={24} color={colors.arcane.emerald} />
                                            )}
                                        </View>
                                        <View style={styles.choiceTextContainer}>
                                            <Text style={styles.choiceLabel}>{choice.label}</Text>
                                            <Text variant="caption" style={styles.choiceSub}>{choice.description}</Text>
                                        </View>
                                    </BlurView>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    ) : (
                        <Animated.View entering={SlideInUp.springify()} style={{ width: '100%', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={handleContinue}
                                activeOpacity={0.8}
                            >
                                <ExpoLinearGradient
                                    colors={[colors.arcane.emerald, colors.arcane.emeraldDark]}
                                    style={styles.continueGradient}
                                >
                                    <Text style={styles.continueText}>{isAlreadyCompleted ? t('common.back').toUpperCase() : t('events.continue_journey')}</Text>
                                </ExpoLinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
            </Animated.ScrollView>

            {/* Header / Back */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.arcane.white} />
                </TouchableOpacity>
                <Text variant="caption" color={colors.arcane.emerald} style={styles.headerText}>{t('events.mysterious_encounter')}</Text>
             </View>
        </View>
    );
};

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
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        zIndex: 10,
    },
    backButton: {
        padding: spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    headerText: {
        marginLeft: spacing.md,
        letterSpacing: 3,
        fontWeight: '900',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing['4xl'],
    },
    imageContainer: {
        width: '100%',
        height: height * 0.4,
        overflow: 'hidden',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    narrativeContainer: {
        padding: spacing.xl,
        marginTop: -spacing.xl,
        backgroundColor: colors.arcane.obsidian,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        minHeight: 200,
    },
    title: {
        color: colors.arcane.white,
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    divider: {
        height: 2,
        width: 100,
        backgroundColor: colors.arcane.emerald,
        alignSelf: 'center',
        marginBottom: spacing.xl,
        opacity: 0.5,
    },
    description: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    choicesContainer: {
        padding: spacing.xl,
        paddingBottom: spacing['2xl'],
        backgroundColor: colors.arcane.obsidian,
    },
    choiceButton: {
        width: '100%',
        marginBottom: spacing.md,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    choiceBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    choiceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    choiceTextContainer: {
        flex: 1,
    },
    choiceLabel: {
        color: colors.arcane.white,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
        marginBottom: 2,
    },
    choiceSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    continueButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        ...shadows.lg,
    },
    continueGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueText: {
        color: colors.arcane.obsidian,
        fontWeight: '900',
        letterSpacing: 2,
    }
});
