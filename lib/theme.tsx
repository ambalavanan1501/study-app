import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export const ACCENT_COLORS = {
    cyberBlue: '#00F0FF',
    neonPurple: '#BC13FE',
    matrixGreen: '#00FF9D',
    hotPink: '#FF0055',
    electricOrange: '#FF9100',
    defaultBlue: '#89B4FA'
};

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
    accentColor: string;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>('dark');
    const [accentColor, setAccentColorState] = useState<string>(ACCENT_COLORS.defaultBlue);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user-theme');
                const savedAccent = await AsyncStorage.getItem('user-accent');

                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setThemeState(savedTheme);
                } else if (systemScheme) {
                    setThemeState(systemScheme);
                }

                if (savedAccent) {
                    setAccentColorState(savedAccent);
                }
            } catch (error) {
                console.error('Failed to load theme/accent', error);
            }
        };
        loadSettings();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    };

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    }

    const setAccentColor = async (color: string) => {
        setAccentColorState(color);
        await AsyncStorage.setItem('user-accent', color);
    };

    // Override the primary/secondary colors with the selected accent
    const activeColors = {
        ...Colors[theme],
        primary: accentColor,
        secondary: accentColor, // For now, make secondary same or derived? Let's keep distinct or just override primary. 
        // Actually for a neon theme, let's making 'primary' the glow color.
    };

    const value = {
        theme,
        colors: activeColors,
        accentColor,
        toggleTheme,
        setTheme,
        setAccentColor
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
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
