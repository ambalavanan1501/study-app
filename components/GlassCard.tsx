import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../lib/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20, tint }) => {
    const { theme, colors } = useTheme();
    const resolvedTint = tint || (theme === 'dark' ? 'dark' : 'light');

    if (Platform.OS === 'android') {
        // Fallback for Android (BlurView can be heavy or inconsistent on some Android versions)
        // Or we can use a semi-transparent background
        return (
            <View style={[
                styles.androidContainer,
                { backgroundColor: theme === 'dark' ? 'rgba(30,30,46,0.9)' : 'rgba(255,255,255,0.9)', borderColor: colors.border },
                style
            ]}>
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.container, { borderColor: colors.border }, style]}>
            <BlurView intensity={intensity} tint={resolvedTint} style={styles.blur}>
                {children}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderTopWidth: 1.5,
        borderLeftWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'transparent',
    },
    androidContainer: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 0,
        overflow: 'hidden'
    },
    blur: {
        padding: 20,
    }
});

export default GlassCard;
