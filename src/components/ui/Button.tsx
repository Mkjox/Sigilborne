import React from 'react';
import { Pressable as RNPressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, borderRadius, spacing, shadows } from '../../theme';
import { useSettingsStore } from '../../store';

const Pressable = React.forwardRef((props, ref) => (
    <RNPressable ref={ref} {...props} />
));
Pressable.displayName = 'ForwardedPressable';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    variant?: ButtonVariant;
    style?: ViewStyle;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    style,
    fullWidth = false,
    disabled,
    onPress,
    ...props
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        if (hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    };

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'primary':
                return styles.primary;
            case 'secondary':
                return styles.secondary;
            case 'tertiary':
                return styles.tertiary;
            default:
                return styles.primary;
        }
    };

    const getTextColor = (): string => {
        if (disabled) return colors.text.disabled;
        switch (variant) {
            case 'primary':
                return colors.text.primary;
            case 'secondary':
                return colors.primary[500];
            case 'tertiary':
                return colors.text.secondary;
            default:
                return colors.text.primary;
        }
    };

    React.useEffect(() => {
        opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 200 });
    }, [disabled]);

    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.button,
                getVariantStyle(),
                fullWidth && styles.fullWidth,
                animatedStyle,
                style,
            ]}
            {...props}
        >
            <Text variant="button" color={getTextColor()}>
                {title}
            </Text>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    primary: {
        backgroundColor: colors.primary[500],
        ...shadows.md,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary[500],
    },
    tertiary: {
        backgroundColor: colors.background.card,
        ...shadows.sm,
    },
    fullWidth: {
        width: '100%',
    },
});
