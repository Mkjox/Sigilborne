import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows } from '../../../theme';

interface MenuPanelProps {
    children: React.ReactNode;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({ children }) => {
    return (
        <View style={styles.outerBorder}>

                <View style={styles.innerContainer}>
                    <View style={styles.content}>
                        {children}
                    </View>
                </View>

            <View style={styles.decorativeBorder} pointerEvents="none">
                <ImageBackground
                    source={require('../../../../assets/ui/border.png')}
                    style={styles.decorativeBorderImage}
                    resizeMode="stretch"
                    capInsets={{ top: 220, left: 220, bottom: 220, right: 220 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerBorder: {
        padding: 18, // Change this after changing the border image
        borderRadius: 4,
        ...shadows.xl,
    },
    decorativeBorder: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 12,
    },
    decorativeBorderImage: {
        flex: 1,
    },
    panelContainer: {
        borderRadius: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    innerContainer: {
        margin: 7,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
});
