import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';

// Keys for SecureStore
const PIN_KEY = 'user_pin';
const IS_BIOMETRICS_ENABLED_KEY = 'is_biometrics_enabled';

interface AppLockContextType {
    isLocked: boolean;
    isAuthenticated: boolean;
    hasPin: boolean;
    isBiometricsEnabled: boolean;
    unlockWithPin: (pin: string) => Promise<boolean>;
    unlockWithBiometrics: () => Promise<boolean>;
    setPin: (pin: string) => Promise<void>;
    toggleBiometrics: (enabled: boolean) => Promise<void>;
    lockApp: () => void;
    isLoading: boolean;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

export const useAppLock = () => {
    const context = useContext(AppLockContext);
    if (!context) {
        throw new Error('useAppLock must be used within an AppLockProvider');
    }
    return context;
};

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    // Load initial settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedPin = await SecureStore.getItemAsync(PIN_KEY);
                const storedBio = await SecureStore.getItemAsync(IS_BIOMETRICS_ENABLED_KEY);

                if (storedPin) {
                    setHasPin(true);
                    // If there is a PIN, start locked
                    setIsLocked(true);
                } else {
                    setIsLocked(false);
                    setIsAuthenticated(true);
                }

                setIsBiometricsEnabled(storedBio === 'true');
            } catch (error) {
                console.error('Failed to load lock settings', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Handle AppState changes (Auto-lock)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // App coming to foreground
                // Logic to check if we should lock is handled in the background-to-background transition below ideally, 
                // but actually we just check 'hasPin' state.
                // For simplicity: if we have a pin, we lock when going background.
            }

            if (nextAppState === 'background' && hasPin) {
                setIsLocked(true);
                setIsAuthenticated(false);
            }

            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, [hasPin, appState]);

    // Prompt for biometrics purely if locked and enabled?
    // We can trigger this manually from the LockScreen, so maybe not auto-trigger here to avoid conflicts.

    const unlockWithPin = useCallback(async (pin: string) => {
        try {
            const storedPin = await SecureStore.getItemAsync(PIN_KEY);
            if (storedPin === pin) {
                setIsLocked(false);
                setIsAuthenticated(true);
                return true;
            }
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    }, []);

    const unlockWithBiometrics = useCallback(async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            console.log('[AppLock] Checking biometrics:', { hasHardware, isEnrolled, isBiometricsEnabled });

            if (!hasHardware || !isEnrolled || !isBiometricsEnabled) {
                console.log('[AppLock] Biometrics unavailable or disabled');
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock App',
                fallbackLabel: 'Use PIN',
            });

            console.log('[AppLock] Auth result:', result);

            if (result.success) {
                setIsLocked(false);
                setIsAuthenticated(true);
                return true;
            }
            return false;
        } catch (e) {
            console.error('[AppLock] Error during biometric auth:', e);
            return false;
        }
    }, [isBiometricsEnabled]);

    const setPin = useCallback(async (pin: string) => {
        try {
            await SecureStore.setItemAsync(PIN_KEY, pin);
            setHasPin(true);
            // If setting PIN for the first time, we consider them authenticated currently? 
            // Or we might want them to confirm it. For now, simple set.
        } catch (e) {
            console.error(e);
        }
    }, []);

    const toggleBiometrics = useCallback(async (enabled: boolean) => {
        try {
            await SecureStore.setItemAsync(IS_BIOMETRICS_ENABLED_KEY, String(enabled));
            setIsBiometricsEnabled(enabled);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const lockApp = useCallback(() => {
        setIsLocked(true);
        setIsAuthenticated(false);
    }, []);

    return (
        <AppLockContext.Provider
            value={{
                isLocked,
                isAuthenticated,
                hasPin,
                isBiometricsEnabled,
                unlockWithPin,
                unlockWithBiometrics,
                setPin,
                toggleBiometrics,
                lockApp,
                isLoading
            }}
        >
            {children}
        </AppLockContext.Provider>
    );
};
