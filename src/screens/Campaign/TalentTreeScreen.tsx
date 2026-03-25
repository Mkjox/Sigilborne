import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useCampaignStore } from '../../store/campaignStore';
import { useDeckStore } from '../../store/deckStore';
import { getTalentTreeForHero } from '../../data/cardData';
import { colors, spacing, typography, shadows, borderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Path, LinearGradient, vec, Group, Circle, Shadow, Blur } from '@shopify/react-native-skia';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'TalentTree'>;

export const TalentTreeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { talentPoints, unlockedTalentIds, unlockTalent } = useCampaignStore();
    const { getActiveDeck } = useDeckStore();
    
    const activeDeck = getActiveDeck();
    const heroId = activeDeck?.heroId || 'hero_commander';
    const tree = useMemo(() => getTalentTreeForHero(heroId), [heroId]);
    
    const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);

    const selectedTalent = useMemo(() => 
        tree?.talents.find(t => t.id === selectedTalentId),
    [tree, selectedTalentId]);

    const handleUnlock = () => {
        if (!selectedTalentId) return;
        
        const res = unlockTalent(selectedTalentId);
        if (res.success) {
            // Success feedback
        } else {
            Alert.alert('Ascension Failed', res.message);
        }
    };

    const isUnlocked = (id: string) => unlockedTalentIds.includes(id);
    
    const canUnlock = (talent: any) => {
        if (isUnlocked(talent.id)) return false;
        if (talentPoints < 1) return false;
        if (!talent.requirements || talent.requirements.length === 0) return true;
        return talent.requirements.every((reqId: string) => isUnlocked(reqId));
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <ExpoLinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void]}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>Hero Ascension</Text>
                    <Text style={styles.subtitle}>Unlock your true potential</Text>
                </View>
                <View style={styles.pointsDisplay}>
                    <Text style={styles.pointsLabel}>POINTS</Text>
                    <Text style={styles.pointsValue}>{talentPoints}</Text>
                </View>
            </ExpoLinearGradient>

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={styles.verticalScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <ScrollView 
                    horizontal
                    contentContainerStyle={styles.horizontalScrollContent}
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.treeView}>
                        {/* Skia Connections */}
                        <Canvas style={StyleSheet.absoluteFill}>
                            {tree?.talents.map(talent => {
                                if (!talent.requirements) return null;
                                return talent.requirements.map(reqId => {
                                    const reqTalent = tree.talents.find(t => t.id === reqId);
                                    if (!reqTalent) return null;
                                    
                                    const start = vec(reqTalent.position.x + 30, reqTalent.position.y + 30);
                                    const end = vec(talent.position.x + 30, talent.position.y + 30);
                                    const active = isUnlocked(talent.id) && isUnlocked(reqId);
                                    
                                    return (
                                        <Group key={`link-${reqId}-${talent.id}`}>
                                            <Path
                                                path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                                                strokeWidth={4}
                                                style="stroke"
                                                color={active ? colors.arcane.emerald : 'rgba(255,255,255,0.1)'}
                                            >
                                                {active && <Blur blur={2} />}
                                            </Path>
                                        </Group>
                                    );
                                });
                            })}
                        </Canvas>

                        {/* Talent Nodes */}
                        {tree?.talents.map(talent => {
                            const unlocked = isUnlocked(talent.id);
                            const selected = selectedTalentId === talent.id;
                            const available = canUnlock(talent);

                            return (
                                <TouchableOpacity
                                    key={talent.id}
                                    style={[
                                        styles.talentNode,
                                        { 
                                            left: talent.position.x, 
                                            top: talent.position.y,
                                            borderColor: selected ? colors.arcane.emerald : (unlocked ? colors.arcane.emeraldLight : 'rgba(255,255,255,0.2)')
                                        },
                                        unlocked && styles.talentNodeUnlocked,
                                        selected && styles.talentNodeSelected,
                                    ]}
                                    onPress={() => setSelectedTalentId(talent.id)}
                                >
                                    <Ionicons 
                                        name={talent.icon as any} 
                                        size={30} 
                                        color={unlocked || selected ? colors.arcane.white : 'rgba(255,255,255,0.4)'} 
                                    />
                                    {available && !unlocked && (
                                        <View style={styles.availableIndicator} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </ScrollView>

            {/* Info Panel */}
            <View style={[styles.infoPanel, !selectedTalent && styles.infoPanelMinimized]}>
                {selectedTalent ? (
                    <>
                        <View style={styles.talentInfoHeader}>
                            <Text style={styles.talentTitle}>{selectedTalent.name}</Text>
                            <TouchableOpacity
                                style={[
                                    styles.unlockButton,
                                    !canUnlock(selectedTalent) && styles.unlockButtonDisabled
                                ]}
                                disabled={!canUnlock(selectedTalent)}
                                onPress={handleUnlock}
                            >
                                <Text style={styles.unlockButtonText}>
                                    {isUnlocked(selectedTalent.id) ? 'ASCENDED' : 'ASCEND (1 PT)'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.talentDescription}>{selectedTalent.description}</Text>
                    </>
                ) : (
                    <Text style={styles.placeholderText}>Select a talent to view details</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.void,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth:1,
        borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: spacing.md,
    },
    title: {
        fontSize: 18,
        color: colors.text.primary,
        fontFamily: typography.fonts.heading,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 10,
        color: colors.arcane.emerald,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pointsDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
    },
    pointsLabel: {
        fontSize: 8,
        color: colors.arcane.emerald,
        fontWeight: 'bold',
        marginRight: spacing.xs,
    },
    pointsValue: {
        fontSize: 14,
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    verticalScrollContent: {
        flexGrow: 1,
    },
    horizontalScrollContent: {
        flexGrow: 1,
        padding: spacing['2xl'],
    },
    treeView: {
        width: 500,
        height: 600,
    },
    talentNode: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        ...shadows.md,
    },
    talentNodeUnlocked: {
        backgroundColor: colors.arcane.emeraldDark,
    },
    talentNodeSelected: {
        backgroundColor: colors.arcane.emerald,
        transform: [{ scale: 1.1 }],
    },
    availableIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.arcane.emeraldLight,
        borderWidth: 2,
        borderColor: colors.arcane.void,
    },
    infoPanel: {
        backgroundColor: colors.arcane.obsidian,
        padding: spacing.lg,
        borderTopWidth: 2,
        borderTopColor: colors.arcane.emerald,
    },
    infoPanelMinimized: {
        paddingVertical: spacing.sm,
    },
    talentInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    talentTitle: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    talentDescription: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    unlockButton: {
        backgroundColor: colors.arcane.emerald,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    unlockButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    unlockButtonText: {
        color: colors.arcane.white,
        fontWeight: '900',
        letterSpacing: 2,
    },
    placeholderText: {
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xl,
        fontStyle: 'italic',
    },
});
