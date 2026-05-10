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
        <View style={StyleSheet.absoluteFill} pointerEvents="none" />
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
