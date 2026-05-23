import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useCampaignStore, ShopItem } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { getAllCards } from '../../data/cardData';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Shop'>;

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
    
    const [selectingToRemove, setSelectingToRemove] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false,
        title: '',
        message: ''
    });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ visible: true, title, message });
    };

    useEffect(() => {
        // Generate new stock if the shop is empty or we just arrived
        if (shopStock.length === 0) {
            generateShopStock();
        }
    }, []);

    const handleBuyItem = (item: ShopItem) => {
        if (item.purchased) return;
        
        if (item.type === 'service' && item.itemId === 'remove_card') {
            if (gold < item.price) {
                showAlert(t('common.not_enough_gold'), t('common.merchant_refusal'));
                return;
            }
            setSelectingToRemove(true);
            return;
        }

        const result = buyItem(item.id);
        
        if (result.success) {
            // If it's a card, add it to the active deck
            if (item.type === 'card' && activeDeck) {
                const cardData = getAllCards().find(c => c.id === item.itemId);
                if (cardData) {
                    addCardToDeck(activeDeck.id, cardData);
                }
            }
            // Relics are handled within buyItem (added to campaignStore.relics)
        } else {
            showAlert(t('common.merchant'), result.message);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Background */}
            <ExpoLinearGradient
                colors={['#0f172a', '#1e1b4b', '#000000']}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} 
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.arcane.white} />
                </TouchableOpacity>
                <View style={styles.goldDisplay}>
                    <Ionicons name="cash" size={16} color={colors.arcane.emerald} style={{ marginRight: 6 }} />
                    <Text variant="h4" color={colors.arcane.white}>{gold}</Text>
                    <Text variant="caption" color={colors.arcane.emerald} style={{ marginLeft: 4 }}> {t('common.gold').toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.titleContainer}>
                <Text variant="h1" style={styles.title}>{t('shop.title').toUpperCase()}</Text>
                <Text variant="caption" color={colors.arcane.emerald} style={styles.subtitle}>
                    {t('shop.subtitle').toUpperCase()}
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles" size={18} color={colors.arcane.emerald} />
                    <Text style={styles.sectionTitle}>
                        {t('shop.sections.stock').toUpperCase()}
                    </Text>
                    <View style={styles.sectionLine} />
                </View>

                    <View style={styles.shopGrid}>
                        {shopStock.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.shopItemCard, item.purchased && styles.shopItemPurchased]}
                                onPress={() => handleBuyItem(item)}
                                disabled={item.purchased}
                            >
                                <View style={styles.itemIconContainer}>
                                    <Ionicons 
                                        name={item.type === 'card' ? 'card' : 'diamond'} 
                                        size={24} 
                                        color={colors.arcane.emerald} 
                                    />
                                </View>
                                <Text style={styles.itemName}>{t(item.name)}</Text>
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>{item.purchased ? 'SOLD' : item.price}</Text>
                                    {!item.purchased && <Ionicons name="cash" size={12} color={colors.arcane.emerald} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
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
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    goldDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
    },
    goldText: {
        color: colors.arcane.white,
        fontWeight: '900',
        fontSize: 16,
    },
    goldLabel: {
        color: colors.arcane.emerald,
        fontWeight: '700',
        fontSize: 10,
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    sectionTitle: {
        color: colors.arcane.emerald,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(16,185,129,0.2)',
    },
    shopGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: spacing.md,
        paddingBottom: spacing['4xl'],
    },
    shopItemCard: {
        width: '30%',
        aspectRatio: 0.8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    shopItemPurchased: {
        opacity: 0.3,
    },
    itemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(16,185,129,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemName: {
        color: colors.arcane.white,
        fontSize: 11,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: spacing.xs,
        gap: 4,
    },
    priceText: {
        color: colors.arcane.emerald,
        fontWeight: '900',
        fontSize: 10,
    },
    removeContainer: {
        flex: 1,
    },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    serviceIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        color: colors.arcane.white,
        fontSize: 16,
        fontWeight: '900',
    },
    serviceDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
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
    selectionPanel: {
        width: width,
        height: height * 0.7,
        backgroundColor: colors.arcane.obsidian,
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderTopWidth: 1,
        borderTopColor: colors.arcane.emerald,
        padding: spacing.xl,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    panelTitle: {
        color: colors.arcane.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    selectionList: {
        paddingBottom: spacing.xl,
    },
    miniCard: {
        flex: 1/3,
        aspectRatio: 0.7,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        margin: 4,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    miniCardName: {
        color: colors.arcane.white,
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    miniCardMana: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.arcane.cyan,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniCardManaText: {
        color: colors.arcane.white,
        fontSize: 8,
        fontWeight: '900',
    }
});
