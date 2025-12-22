import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// --- Color Palettes (Catppuccin inspired) ---
export const Colors = {
    dark: {
        background: '#11111B',
        surface: '#1E1E2E',
        surfaceHighlight: '#313244',
        text: '#CDD6F4',
        subtext: '#A6ADC8',
        primary: '#89B4FA', // Blue
        secondary: '#CBA6F7', // Mauve
        success: '#A6E3A1', // Green
        danger: '#F38BA8', // Red
        warning: '#FAB387', // Peach
        overlay: 'rgba(30, 30, 46, 0.8)', // For glass effect
        border: '#313244',
        tabBar: 'rgba(30, 30, 46, 0.85)',
    },
    light: {
        background: '#EFF1F5',
        surface: '#FFFFFF',
        surfaceHighlight: '#E6E9EF',
        text: '#4C4F69',
        subtext: '#6C6F85',
        primary: '#1E66F5', // Blue
        secondary: '#8839EF', // Mauve
        success: '#40A02B', // Green
        danger: '#D20F39', // Red
        warning: '#FE640B', // Peach
        overlay: 'rgba(255, 255, 255, 0.8)', // For glass effect
        border: '#BCC0CC',
        tabBar: 'rgba(255, 255, 255, 0.85)',
    }
};

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    colors: typeof Colors.dark;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>('dark'); // Default to dark

    useEffect(() => {
        // Load saved theme or fall back to system
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user-theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setThemeState(savedTheme);
                } else if (systemScheme) {
                    setThemeState(systemScheme);
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('user-theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('user-theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    }

    const value = {
        theme,
        colors: Colors[theme],
        toggleTheme,
        setTheme
    };

    return (
        <ThemeContext.Provider value= { value } >
        { children }
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
