import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { AnimatedBackground, GlassCard, Text } from '../../components/ui';
import { colors, spacing } from '../../theme';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

export const GameBoardScreen: React.FC<Props> = ({ navigation, route }) => {
    const { difficulty } = route.params;

    return (
        <View style={styles.container}>
            <AnimatedBackground />

            <View style={styles.content}>
                <GlassCard style={styles.card}>
                    <View style={styles.cardContent}>
                        <Text variant="h2" style={styles.title}>
                            Game Board
                        </Text>
                        <Text variant="body" style={styles.subtitle}>
                            Difficulty: {difficulty}
                        </Text>
                        <Text variant="bodySmall" color={colors.text.secondary} style={styles.placeholder}>
                            Game board will be implemented in Phase 2-3
                        </Text>
                    </View>
                </GlassCard>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    card: {
        maxWidth: 600,
    },
    cardContent: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    title: {
        marginBottom: spacing.md,
    },
    subtitle: {
        marginBottom: spacing.lg,
        textTransform: 'capitalize',
    },
    placeholder: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
