import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Dimensions,
    Modal,
    Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useCampaignStore, ShopItem } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import { colors, spacing, typography, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Rect, LinearGradient, vec } from '@shopify/react-native-skia';
import { getAllCards } from '../../data/cardData';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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

    const renderShopItem = ({ item }: { item: ShopItem }) => (
        <TouchableOpacity
            style={[
                styles.itemCard,
                item.purchased && styles.itemPurchased,
                item.rarity === 'legendary' && styles.legendaryBorder
            ]}
            onPress={() => handleBuyItem(item)}
            disabled={item.purchased}
        >
            <View style={styles.itemIconContainer}>
                {item.type === 'card' && <Ionicons name="documents-outline" size={32} color={colors.primary[400]} />}
                {item.type === 'relic' && <Ionicons name="diamond-outline" size={32} color={colors.primary[500]} />}
                {item.type === 'service' && <Ionicons name="trash-outline" size={32} color={colors.error} />}
            </View>
            
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
            
            <View style={styles.priceTag}>
                <Ionicons name="cash-outline" size={12} color="#FFD700" />
                <Text style={styles.priceText}>{item.price}</Text>
            </View>
            
            {item.purchased && (
                <View style={styles.soldOverlay}>
                    <Text style={styles.soldText}>SOLD</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Merchant Background Header */}
            <ExpoLinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Traveling Merchant</Text>
                        <Text style={styles.subtitle}>Fine wares for the brave...</Text>
                    </View>
                    <View style={styles.goldDisplay}>
                        <Ionicons name="cash-outline" size={18} color="#FFD700" />
                        <Text style={styles.goldText}>{gold}</Text>
                    </View>
                </View>
            </ExpoLinearGradient>

            <View style={styles.content}>
                {selectingToRemove ? (
                    <View style={styles.removalContainer}>
                        <View style={styles.removalHeader}>
                            <Text style={styles.removalTitle}>Select a card to remove</Text>
                            <TouchableOpacity onPress={() => setSelectingToRemove(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={activeDeck?.cards || []}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.deckCard}
                                    onPress={() => handleRemoveCard(item.id)}
                                >
                                    <View>
                                        <Text style={styles.deckCardName}>{item.name}</Text>
                                        <Text style={styles.deckCardType}>{item.type}</Text>
                                    </View>
                                    <Ionicons name="trash" size={18} color={colors.error} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={shopStock}
                        renderItem={renderShopItem}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                    />
                )}
            </View>


            {/* Custom Alert Modal */}
            <Modal
                transparent
                visible={alertConfig.visible}
                animationType="fade"
                onRequestClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            >
                <Pressable 
                    style={styles.modalBackdrop} 
                    onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                >
                    <Animated.View 
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Ionicons name="notifications" size={24} color="#FFD700" />
                            <Text style={styles.modalTitle}>{alertConfig.title.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.modalMessage}>{alertConfig.message}</Text>
                        <TouchableOpacity 
                            style={styles.modalButton}
                            onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                        >
                            <ExpoLinearGradient
                                colors={['#FFD700', '#B8860B']}
                                style={styles.modalButtonGradient}
                            >
                                <Text style={styles.modalButtonText}>UNDERSTOOD</Text>
                            </ExpoLinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* Skia Atmospheric Background */}
            <Canvas style={styles.canvas}>
                <Rect x={0} y={0} width={width} height={height}>
                    <LinearGradient
                        start={vec(0, 0)}
                        end={vec(width, height)}
                        colors={['rgba(26, 26, 46, 0.8)', 'rgba(22, 33, 62, 0.9)']}
                    />
                </Rect>
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        zIndex: -1,
    },
    header: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        marginRight: spacing.md,
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        color: colors.text.primary,
        fontFamily: typography.fonts.heading,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 11,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    goldDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    goldText: {
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    itemCard: {
        width: (width - spacing.md * 4) / 3,
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...shadows.md,
    },
    itemPurchased: {
        opacity: 0.6,
    },
    legendaryBorder: {
        borderColor: colors.primary[500],
        borderWidth: 2,
    },
    itemIconContainer: {
        alignItems: 'center',
        marginBottom: 4,
    },
    itemName: {
        color: colors.text.primary,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 2,
    },
    itemDescription: {
        color: colors.text.secondary,
        fontSize: 10,
        textAlign: 'center',
        height: 32,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingVertical: 2,
        borderRadius: 6,
    },
    priceText: {
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 12,
    },
    soldOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    soldText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 20,
        transform: [{ rotate: '-15deg' }],
    },
    removalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: spacing.md,
    },
    removalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    removalTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelText: {
        color: colors.error,
        fontWeight: 'bold',
    },
    deckCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        padding: spacing.md,
        borderRadius: 8,
        marginBottom: spacing.sm,
    },
    deckCardName: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    deckCardType: {
        color: colors.text.secondary,
        fontSize: 12,
        textTransform: 'capitalize',
    },
    // New Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: 320,
        backgroundColor: colors.background.secondary,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#FFD700',
        alignItems: 'center',
        ...shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: '900',
        marginLeft: 10,
        letterSpacing: 2,
    },
    modalMessage: {
        fontSize: 14,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    modalButton: {
        width: '100%',
        height: 44,
        borderRadius: 8,
        overflow: 'hidden',
    },
    modalButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: colors.background.primary,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
