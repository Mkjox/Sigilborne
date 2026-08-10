import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useCampaignStore, ShopItem } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import { colors, spacing, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { getAllCards } from '../../data/cardData';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Shop'>;

const FactionColors: Record<string, string> = {
    order: '255, 215, 0',
    shadow: '168, 85, 247',
    nature: '16, 185, 129',
    arcane: '6, 182, 212',
    neutral: '156, 163, 175',
};

const FactionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    order: 'shield-half',
    shadow: 'moon',
    nature: 'leaf',
    arcane: 'star',
    neutral: 'scale',
};

export const ShopScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { t } = useTranslation();

    const {
        gold,
        shopStock,
        generateShopStock,
        buyItem,
    } = useCampaignStore();

    const { getActiveDeck, addCardToDeck } = useDeckStore();
    const activeDeck = getActiveDeck();


    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false,
        title: '',
        message: ''
    });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ visible: true, title, message });
    };

    useEffect(() => {
        if (shopStock.length === 0) {
            generateShopStock();
        }
    }, []);

    const handleBuyItem = (item: ShopItem) => {
        if (item.purchased) return;

        const result = buyItem(item.id);

        if (result.success) {
            if (item.type === 'card' && activeDeck) {
                const cardData = getAllCards().find(c => c.id === item.itemId);
                if (cardData) {
                    addCardToDeck(activeDeck.id, cardData);
                }
            }
        } else {
            showAlert(t('common.merchant'), result.message);
        }
    };

    const insets = useSafeAreaInsets();

    const relics = shopStock.filter(i => i.type === 'relic');
    const unlocks = shopStock.filter(i => i.type === 'faction_unlock');


    return (
        <View style={styles.container}>
            {/* Background */}
            <ExpoLinearGradient
                colors={['#050505', '#1a0b2e', '#000000']}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <BlurView intensity={20} tint="dark" style={styles.backButtonBlur}>
                            <Ionicons name="chevron-back" size={24} color={colors.arcane.white} />
                        </BlurView>
                    </TouchableOpacity>

                    <Animated.View entering={FadeIn.delay(200)} style={styles.goldContainer}>
                        <BlurView intensity={30} tint="dark" style={styles.goldBlur}>
                            <View style={styles.goldIconCircle}>
                                <Ionicons name="cash" size={16} color="#fbbf24" />
                            </View>
                            <Text style={styles.goldText}>{gold}</Text>
                        </BlurView>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInUp.delay(100)} style={styles.titleContainer}>
                    <Text style={styles.title}>{t('shop.title').toUpperCase()}</Text>
                    <Text style={styles.subtitle}>{t('shop.subtitle').toUpperCase()}</Text>
                </Animated.View>

                <View style={styles.contentContainer}>

                    {/* RELICS SECTION */}
                    {relics.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles" size={16} color="#f59e0b" />
                                <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>
                                    {t('shop.sections.artifacts').toUpperCase()}
                                </Text>
                                <View style={[styles.sectionLine, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]} />
                            </View>
                            <View style={styles.shopGrid}>
                                {relics.map((item, index) => (
                                    <Animated.View key={item.id} entering={FadeInUp.delay(200 + index * 50)} style={styles.shopItemWrapper}>
                                        <TouchableOpacity
                                            style={[styles.relicCard, item.purchased && styles.shopItemPurchased]}
                                            onPress={() => handleBuyItem(item)}
                                            disabled={item.purchased}
                                        >
                                            <ExpoLinearGradient colors={['rgba(245, 158, 11, 0.1)', 'transparent']} style={StyleSheet.absoluteFillObject} />
                                            <View style={styles.relicIconContainer}>
                                                <Ionicons name="diamond" size={28} color="#f59e0b" />
                                            </View>
                                            <Text style={styles.itemName}>{t(item.name)}</Text>
                                            <View style={styles.priceTag}>
                                                <Text style={styles.priceText}>{item.purchased ? 'SOLD' : item.price}</Text>
                                                {!item.purchased && <Ionicons name="cash" size={12} color="#fbbf24" />}
                                            </View>
                                            {item.purchased && <View style={styles.soldOverlay}><Text style={styles.soldText}>SOLD</Text></View>}
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* FACTION UNLOCKS SECTION */}
                    {unlocks.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="book" size={16} color={colors.arcane.cyan} />
                                <Text style={[styles.sectionTitle, { color: colors.arcane.cyan }]}>
                                    {t('shop.sections.unlocks', 'SEALED TOMES').toUpperCase()}
                                </Text>
                                <View style={[styles.sectionLine, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]} />
                            </View>
                            <View style={styles.shopGrid}>
                                {unlocks.map((item, index) => {
                                    const fColorRgb = FactionColors[item.itemId] || '16, 185, 129';
                                    const fColor = `rgb(${fColorRgb})`;
                                    const fIcon = FactionIcons[item.itemId] || 'book';
                                    return (
                                        <Animated.View key={item.id} entering={FadeInUp.delay(300 + index * 50)} style={styles.shopItemWrapper}>
                                            <TouchableOpacity
                                                style={[styles.unlockCard, { borderColor: `rgba(${fColorRgb}, 0.3)` }, item.purchased && styles.shopItemPurchased]}
                                                onPress={() => handleBuyItem(item)}
                                                disabled={item.purchased}
                                            >
                                                <ExpoLinearGradient colors={[`rgba(${fColorRgb}, 0.1)`, 'transparent']} style={StyleSheet.absoluteFillObject} />
                                                <View style={[styles.unlockIconContainer, { backgroundColor: `rgba(${fColorRgb}, 0.1)` }]}>
                                                    <Ionicons name={fIcon as any} size={24} color={fColor} />
                                                </View>
                                                <Text style={styles.itemName}>{t(item.name)}</Text>
                                                <View style={[styles.priceTag, { backgroundColor: `rgba(${fColorRgb}, 0.1)` }]}>
                                                    <Text style={[styles.priceText, { color: fColor }]}>{item.purchased ? 'SOLD' : item.price}</Text>
                                                    {!item.purchased && <Ionicons name="cash" size={12} color={fColor} />}
                                                </View>
                                                {item.purchased && <View style={styles.soldOverlay}><Text style={styles.soldText}>SOLD</Text></View>}
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </View>
                    )}


                </View>
            </ScrollView>

            {/* Custom Alert Modal */}
            <Modal
                visible={alertConfig.visible}
                transparent
                animationType="fade"
            >
                <View style={styles.modalBackdrop}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Animated.View entering={FadeInUp} style={styles.alertContent}>
                        <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                        <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                        <TouchableOpacity
                            style={styles.alertButton}
                            onPress={() => setAlertConfig({ ...alertConfig, visible: false })}
                        >
                            <Text style={styles.alertButtonText}>{t('common.back').toUpperCase()}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        zIndex: 10,
    },
    backButton: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    backButtonBlur: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goldContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    goldBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    goldIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    goldText: {
        color: colors.arcane.white,
        fontWeight: '900',
        fontSize: 16,
    },
    titleContainer: {
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        color: colors.arcane.white,
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
        fontFamily: typography.fonts.heading,
        textAlign: 'center',
    },
    subtitle: {
        color: colors.arcane.emerald,
        fontSize: 12,
        letterSpacing: 2,
        marginTop: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeTab: {
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderColor: colors.arcane.emerald,
    },
    tabText: {
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 12,
    },
    activeTabText: {
        color: colors.arcane.emerald,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: spacing.xl,
    },
    sectionContainer: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    sectionLine: {
        flex: 1,
        height: 1,
    },
    shopGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    shopItemWrapper: {
        width: '30%',
    },
    relicCard: {
        aspectRatio: 0.8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    unlockCard: {
        aspectRatio: 0.8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        padding: spacing.sm,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    shopItemPurchased: {
        opacity: 0.5,
    },
    relicIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    unlockIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    itemName: {
        color: colors.arcane.white,
        fontSize: 10,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    priceText: {
        color: '#f59e0b',
        fontWeight: '900',
        fontSize: 11,
    },
    soldOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldText: {
        color: colors.arcane.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 4,
        transform: [{ rotate: '-15deg' }],
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContent: {
        width: width * 0.8,
        backgroundColor: colors.arcane.obsidian,
        padding: spacing.xl,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        alignItems: 'center',
    },
    alertTitle: {
        color: colors.arcane.white,
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: spacing.md,
    },
    alertMessage: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
    },
    alertButton: {
        width: '100%',
        paddingVertical: spacing.md,
        backgroundColor: colors.arcane.emerald,
        alignItems: 'center',
        borderRadius: 2,
    },
    alertButtonText: {
        color: colors.arcane.obsidian,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
