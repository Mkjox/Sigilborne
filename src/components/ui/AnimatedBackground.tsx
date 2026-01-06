import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme';

const { width, height } = Dimensions.get('window');

export const AnimatedBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 20000,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <>
            <LinearGradient
                colors={[
                    colors.background.primary,
                    colors.primary[900],
                    colors.background.primary,
                ]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <Animated.View style={[styles.overlay, animatedStyle]}>
                <LinearGradient
                    colors={[
                        'rgba(102, 0, 255, 0.1)',
                        'rgba(0, 160, 255, 0.05)',
                        'rgba(255, 185, 0, 0.05)',
                    ]}
                    style={styles.overlayGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>
            {children}
        </>
    );
};

const styles = StyleSheet.create({
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    overlay: {
        position: 'absolute',
        left: -width / 2,
        top: -height / 2,
        width: width * 2,
        height: height * 2,
    },
    overlayGradient: {
        flex: 1,
    },
});
