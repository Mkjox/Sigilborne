import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, shadows } from '../../theme';

interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
    intensity?: number;
    borderColor?: string;
    glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    intensity = 20,
    borderColor = colors.glass.border,
    glowColor,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, glowColor && { ...shadows.glow, shadowColor: glowColor }, style]} {...props}>
            <BlurView intensity={intensity} style={styles.blur}>
                <View style={[styles.content, { borderColor }]}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    blur: {
        flex: 1,
    },
    content: {
        flex: 1,
        backgroundColor: colors.glass.background,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
    },
});
