import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/campaignStore';
import { getRelicById } from '../../data/relicData';
import { colors, spacing, borderRadius, shadows, typography } from '../../theme';
import { Text } from '../ui';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

export const RelicTray: React.FC = () => {
    const relics = useCampaignStore((state) => state.relics);
    const { t } = useTranslation();
    const [selectedRelicId, setSelectedRelicId] = useState<string | null>(null);

    if (relics.length === 0) return null;

    const selectedRelic = selectedRelicId ? getRelicById(selectedRelicId) : null;

    return (
        <View style={styles.outerContainer}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.contentContainer}
            >
                {relics.map((relicId, index) => {
                    const relic = getRelicById(relicId);
                    if (!relic) return null;
                    
                    const isBoss = relic.rarity === 'boss';
                    const isRare = relic.rarity === 'rare';

                    return (
                        <TouchableOpacity 
                            key={`${relicId}-${index}`} 
                            style={[
                                styles.relicItem,
                                isBoss && styles.relicItemBoss,
                                isRare && styles.relicItemRare,
                            ]}
                            onPress={() => setSelectedRelicId(relicId)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons 
                                name={relic.icon as any} 
                                size={18} 
                                color={isBoss ? '#fbbf24' : (isRare ? colors.arcane.cyan : colors.arcane.emerald)} 
                            />
                            {isBoss && <View style={styles.bossCrown} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Relic Detail Modal */}
            <Modal
                transparent
                visible={!!selectedRelicId}
                animationType="none"
                onRequestClose={() => setSelectedRelicId(null)}
            >
                <Animated.View 
                    entering={FadeIn.duration(200)} 
                    exiting={FadeOut.duration(200)}
                    style={styles.modalBackdrop}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedRelicId(null)} />
                    
                    {selectedRelic && (
                        <Animated.View 
                            entering={ZoomIn.springify()}
                            style={styles.modalContent}
                        >
                            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(30, 30, 60, 0.95)', 'rgba(10, 10, 20, 0.98)']}
                                style={styles.modalGradient}
                            >
                                <View style={styles.modalHeader}>
                                    <View style={[
                                        styles.iconContainer,
                                        selectedRelic.rarity === 'boss' && styles.iconContainerBoss,
                                        selectedRelic.rarity === 'rare' && styles.iconContainerRare,
                                    ]}>
                                        <MaterialCommunityIcons 
                                            name={selectedRelic.icon as any} 
                                            size={32} 
                                            color={selectedRelic.rarity === 'boss' ? '#fbbf24' : (selectedRelic.rarity === 'rare' ? colors.arcane.cyan : colors.arcane.emerald)} 
                                        />
                                    </View>
                                    <View style={styles.titleContainer}>
                                        <Text variant="h3" style={styles.relicName}>{t(selectedRelic.name)}</Text>
                                        <View style={[
                                            styles.rarityBadge,
                                            { backgroundColor: selectedRelic.rarity === 'boss' ? 'rgba(251, 191, 36, 0.1)' : (selectedRelic.rarity === 'rare' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)') }
                                        ]}>
                                            <Text style={[
                                                styles.rarityText,
                                                { color: selectedRelic.rarity === 'boss' ? '#fbbf24' : (selectedRelic.rarity === 'rare' ? colors.arcane.cyan : colors.arcane.emerald) }
                                            ]}>
                                                {t(`common.rarities.${selectedRelic.rarity}`).toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.description}>{t(selectedRelic.description)}</Text>
                                
                                <TouchableOpacity 
                                    style={styles.closeButton}
                                    onPress={() => setSelectedRelicId(null)}
                                >
                                    <Text style={styles.closeButtonText}>{t('common.back').toUpperCase()}</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    )}
                </Animated.View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        height: 40,
        justifyContent: 'center',
    },
    contentContainer: {
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        gap: spacing.xs,
    },
    relicItem: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    relicItemBoss: {
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    relicItemRare: {
        borderColor: colors.arcane.cyan,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
    },
    bossCrown: {
        position: 'absolute',
        top: -4,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fbbf24',
        borderWidth: 1,
        borderColor: colors.arcane.obsidian,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...shadows.lg,
    },
    modalGradient: {
        padding: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    iconContainerBoss: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    iconContainerRare: {
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
    },
    titleContainer: {
        flex: 1,
    },
    relicName: {
        color: colors.arcane.white,
        marginBottom: 4,
    },
    rarityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    rarityText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: spacing.lg,
    },
    description: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: colors.arcane.emerald,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        ...shadows.md,
    },
    closeButtonText: {
        color: colors.arcane.obsidian,
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 14,
    }
});
