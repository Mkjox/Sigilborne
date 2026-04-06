import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Modal,
    Pressable,
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

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Shop'>;

export const ShopScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    
    const { 
        gold, 
        shopStock, 
        generateShopStock, 
        buyItem, 
        removeCardFromDeck 
    } = useCampaignStore();
    
    const { getActiveDeck, addCardToDeck, removeCardFromDeck: removeCardFromActiveDeck } = useDeckStore();
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
                showAlert('Not enough gold!', 'The merchant shakes his head. "Come back when you have more coin, traveler."');
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
            showAlert('Merchant says:', result.message);
        }
    };

    const handleRemoveCard = (cardId: string) => {
        if (!activeDeck) return;
        
        const result = removeCardFromDeck(cardId);
        if (result.success) {
            removeCardFromActiveDeck(activeDeck.id, cardId);
            setSelectingToRemove(false);
            showAlert('Purged', 'The card burns away into arcane dust. Your deck feels lighter.');
        }
    };

    const insets = useSafeAreaInsets();

    const renderShopItem = ({ item, index }: { item: ShopItem; index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 100).springify().damping(20)}>
            <TouchableOpacity
                style={[
                    styles.itemCardWrapper,
                    item.purchased && styles.itemPurchasedWrapper
                ]}
                onPress={() => handleBuyItem(item)}
                disabled={item.purchased}
                activeOpacity={0.8}
            >
                <BlurView 
                    intensity={item.purchased ? 10 : 30} 
                    tint="dark" 
                    style={[
                        styles.itemCardInner,
                        item.rarity === 'legendary' && !item.purchased && styles.legendaryBorder
                    ]}
                >
                    <View style={styles.itemIconContainer}>
                        {item.type === 'card' && <Ionicons name="documents-outline" size={32} color={colors.primary[300]} />}
                        {item.type === 'relic' && <Ionicons name="diamond-outline" size={32} color={colors.arcane.emerald} />}
                        {item.type === 'service' && <Ionicons name="flame-outline" size={32} color={colors.error} />}
                    </View>
                    
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                    
                    <View style={styles.priceTag}>
                        <Ionicons name="cash" size={14} color="#FBBF24" />
                        <Text style={styles.priceText}>{item.price}</Text>
                    </View>
                    
                    {item.purchased && (
                        <View style={styles.soldOverlay}>
                            <Text style={styles.soldText}>ACQUIRED</Text>
                        </View>
                    )}
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {/* Deep Void Merchant Background */}
            <ExpoLinearGradient
                colors={['#0f172a', '#2e1022', '#000000']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Float Header overlay */}
            <ExpoLinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']}
                style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>The Void Merchant</Text>
                    <Text style={styles.subtitle}>Relics of forgotten times...</Text>
                </View>
                <View style={styles.goldDisplay}>
                    <Ionicons name="cash" size={16} color="#FBBF24" />
                    <Text style={styles.goldText}>{gold}</Text>
                </View>
            </ExpoLinearGradient>

            <View style={styles.content}>
                {selectingToRemove ? (
                    <Animated.View entering={FadeInUp.springify()} style={styles.removalContainer}>
                        <BlurView intensity={40} tint="dark" style={styles.removalInner}>
                            <View style={styles.removalHeader}>
                                <Text style={styles.removalTitle}>Select an offering to burn</Text>
                                <TouchableOpacity onPress={() => setSelectingToRemove(false)} style={styles.cancelBtn}>
                                    <Text style={styles.cancelText}>CANCEL</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={activeDeck?.cards || []}
                                keyExtractor={(item) => item.id}
                                numColumns={2}
                                columnWrapperStyle={styles.removalColumn}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.deckCard}
                                        onPress={() => handleRemoveCard(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <ExpoLinearGradient colors={['rgba(255,0,0,0.1)', 'rgba(0,0,0,0.5)']} style={styles.deckCardGradient}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.deckCardName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.deckCardType}>{item.type}</Text>
                                            </View>
                                            <Ionicons name="flame" size={20} color={colors.error} />
                                        </ExpoLinearGradient>
                                    </TouchableOpacity>
                                )}
                            />
                        </BlurView>
                    </Animated.View>
                ) : (
                    <FlatList
                        data={shopStock}
                        renderItem={renderShopItem as any}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, spacing.xl) }]}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Custom Glassmorphism Alert Modal */}
            <Modal
                transparent
                visible={alertConfig.visible}
                animationType="none"
                onRequestClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            >
                {alertConfig.visible && (
                    <Animated.View 
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={styles.modalBackdropWrapper}
                    >
                        <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
                            <Pressable 
                                style={StyleSheet.absoluteFillObject} 
                                onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                            />
                            <Animated.View entering={FadeInUp.springify().damping(18)} style={styles.modalContent}>
                                <ExpoLinearGradient colors={['rgba(153, 27, 27, 0.2)', 'rgba(0,0,0,0.6)']} style={styles.modalGradientBg}>
                                    <View style={styles.modalHeader}>
                                        <Ionicons name="infinite" size={24} color="#FBBF24" />
                                        <Text style={styles.modalTitle}>{alertConfig.title.toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.modalMessage}>{alertConfig.message}</Text>
                                    
                                    <TouchableOpacity 
                                        style={styles.modalButton}
                                        onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                                        activeOpacity={0.8}
                                    >
                                        <ExpoLinearGradient colors={['#FBBF24', '#D97706']} style={styles.modalButtonGradient}>
                                            <Text style={styles.modalButtonText}>UNDERSTOOD</Text>
                                        </ExpoLinearGradient>
                                    </TouchableOpacity>
                                </ExpoLinearGradient>
                            </Animated.View>
                        </BlurView>
                    </Animated.View>
                )}
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
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(251, 191, 36, 0.2)',
        zIndex: 10,
    },
    closeButton: {
        marginRight: spacing.md,
        padding: spacing.xs,
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
        color: '#FBBF24',
        fontStyle: 'italic',
        letterSpacing: 1.5,
    },
    goldDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FBBF24',
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    goldText: {
        color: '#FBBF24',
        fontWeight: '900',
        marginLeft: 6,
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    listContent: {
        paddingTop: spacing.sm,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    itemCardWrapper: {
        width: (width - spacing.lg * 2 - spacing.md * 2) / 3, // dynamic sizing accounting for gaps
        marginBottom: spacing.md,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    itemPurchasedWrapper: {
        opacity: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    legendaryBorder: {
        borderWidth: 2,
        borderColor: colors.arcane.emerald,
    },
    itemCardInner: {
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        minHeight: 160,
    },
    itemIconContainer: {
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    itemName: {
        color: colors.arcane.white,
        fontSize: 14,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 1,
    },
    itemDescription: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        textAlign: 'center',
        flex: 1,
        lineHeight: 14,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    priceText: {
        color: '#FBBF24',
        fontWeight: '900',
        marginLeft: 6,
        fontSize: 14,
    },
    soldOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 3,
        transform: [{ rotate: '-15deg' }],
    },
    removalContainer: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,0,0,0.3)',
    },
    removalInner: {
        flex: 1,
        padding: spacing.lg,
    },
    removalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth:1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    removalTitle: {
        color: colors.arcane.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    cancelBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,0,0,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.error,
    },
    cancelText: {
        color: colors.error,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    removalColumn: {
        justifyContent: 'space-between',
    },
    deckCard: {
        width: '48%',
        marginBottom: spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    deckCardGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    deckCardName: {
        color: colors.arcane.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    deckCardType: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    modalBackdropWrapper: {
        flex: 1,
        zIndex: 1000,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: Math.min(400, width * 0.9),
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FBBF24',
        ...shadows.lg,
        shadowColor: '#FBBF24',
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalGradientBg: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(251, 191, 36, 0.3)',
        paddingBottom: spacing.sm,
        width: '100%',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        color: '#FBBF24',
        fontWeight: '900',
        marginLeft: 10,
        letterSpacing: 2,
    },
    modalMessage: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    modalButton: {
        width: '80%',
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FBBF24',
    },
    modalButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#000',
        fontWeight: '900',
        letterSpacing: 2,
    },
});
