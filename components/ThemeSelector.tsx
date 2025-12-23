import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme, ACCENT_COLORS } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

const ThemeSelector = () => {
    const { accentColor, setAccentColor, colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Accent Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {Object.entries(ACCENT_COLORS).map(([name, color]) => (
                    <TouchableOpacity
                        key={name}
                        style={[
                            styles.colorButton,
                            { backgroundColor: color },
                            accentColor === color && { borderColor: colors.text, borderWidth: 2 }
                        ]}
                        onPress={() => setAccentColor(color)}
                    >
                        {accentColor === color && <Ionicons name="checkmark" size={16} color="#000" />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    scrollContent: {
        paddingVertical: 5,
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    }
});

export default ThemeSelector;
