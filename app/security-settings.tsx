import React from 'react';
import SecuritySettings from '../components/SecuritySettings';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';

export default function SecuritySettingsScreen() {
    const { theme } = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#f2f2f7' }]}>
            <SecuritySettings />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
