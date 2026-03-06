import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing } from '../../theme';

interface BoardSurfaceProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

export const BoardSurface: React.FC<BoardSurfaceProps> = ({ style, children }) => {
    return (
        <View style={[styles.container, style]}>
            {/* Vignette Overlay for depth */}
            <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.4)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {children}
        </View>
    );
};


interface OrnateFrameProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    variant?: 'gold' | 'silver' | 'bronze';
}

export const OrnateFrame: React.FC<OrnateFrameProps> = ({ style, children, variant = 'gold' }) => {
    const getBorderColors = () => {
        switch (variant) {
            case 'silver': return ['#C0C0C0', '#E8E8E8', '#A0A0A0'];
            case 'bronze': return ['#CD7F32', '#B87333', '#8B4513'];
            case 'gold':
            default: return ['#B8860B', '#FFD700', '#DAA520'];
        }
    };

    return (
        <View style={[styles.frameContainer, style]}>
            <LinearGradient
                colors={getBorderColors() as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.frameBorder}
            >
                <View style={styles.frameInner}>
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    frameContainer: {
        padding: 2, // Border width
        borderRadius: borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    frameBorder: {
        borderRadius: borderRadius.lg,
        padding: 2,
    },
    frameInner: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg - 2,
        overflow: 'hidden',
    },
});
