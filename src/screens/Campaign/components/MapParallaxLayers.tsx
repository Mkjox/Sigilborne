import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    interpolate, 
    SharedValue,
    interpolateColor
} from 'react-native-reanimated';
import { Canvas, Rect, Circle, Blur, Group } from '@shopify/react-native-skia';
import { MAP_BIOMES } from '../constants';

interface ParallaxProps {
    scrollY: SharedValue<number>;
    totalHeight: number;
}

// Biome Definitions are now imported from CampaignMapScreen

const LAYER_COUNT = 15;

export const MapParallaxLayers: React.FC<ParallaxProps> = ({ scrollY, totalHeight }) => {
    const { width, height } = useWindowDimensions();

    // Generate random elements once
    const elements = useMemo(() => {
        return Array.from({ length: LAYER_COUNT }).map((_, i) => ({
            id: i,
            x: Math.random() * width,
            y: Math.random() * totalHeight,
            size: 10 + Math.random() * 40,
            speed: 0.1 + Math.random() * 0.8, // Parallax multiplier
            opacity: 0.1 + Math.random() * 0.3,
            rotation: Math.random() * 360,
        }));
    }, [width]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {elements.map((el) => {
                const animatedStyle = useAnimatedStyle(() => {
                    // Biome Progress
                    const progress = scrollY.value / (totalHeight || 1);
                    const biomeIndex = Math.min(4, Math.floor(progress * 5));

                    // Base Parallax motion
                    let translateY = -scrollY.value * el.speed;
                    let translateX = el.x - el.size / 2;
                    let scale = 1;

                    // Biome-specific behavior overrides
                    if (biomeIndex === 0) { // Verdant Echo: Sway
                        translateX += Math.sin(scrollY.value * 0.002 + el.id) * 10;
                    } else if (biomeIndex === 1) { // Azure Spire: Faster downward
                        translateY -= scrollY.value * 0.1;
                    } else if (biomeIndex === 2) { // Twilight Rift: Pulse
                        scale = interpolate(
                            Math.sin(scrollY.value * 0.005 + el.id),
                            [-1, 1],
                            [0.8, 1.2]
                        );
                    } else if (biomeIndex >= 3) { // Ember Zones: Rising tension
                        translateY -= scrollY.value * 0.2;
                    }
                    
                    // Fade out when far from center height
                    const currentY = el.y + translateY;
                    const opacity = interpolate(
                        currentY,
                        [-200, height/2, height + 200],
                        [0, el.opacity, 0],
                        'clamp'
                    );

                    const color = interpolateColor(
                        scrollY.value,
                        MAP_BIOMES.map(b => (b.start / 200) * totalHeight),
                        MAP_BIOMES.map(b => b.colors[0])
                    );

                    return {
                        transform: [
                            { translateY: el.y + translateY },
                            { translateX },
                            { rotate: `${el.rotation + (scrollY.value * 0.05)}deg` },
                            { scale }
                        ],
                        opacity,
                        borderColor: color,
                    };
                });

                return (
                    <Animated.View
                        key={el.id}
                        style={[
                            styles.element,
                            {
                                width: el.size,
                                height: el.size,
                            },
                            animatedStyle
                        ]}
                    >
                        <View style={styles.elementInner} />
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    element: {
        position: 'absolute',
        borderWidth: 1,
        borderRadius: 50, // Pure circle
        justifyContent: 'center',
        alignItems: 'center',
    },
    elementInner: {
        width: '30%',
        height: '30%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 50, // Internal glow circle
    }
});
