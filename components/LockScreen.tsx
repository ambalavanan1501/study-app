import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppLock } from '../contexts/AppLockContext';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const LockScreen = () => {
    const { unlockWithPin, unlockWithBiometrics, isBiometricsEnabled } = useAppLock();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    // Animation for error shake
    const [shakeAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
        if (isBiometricsEnabled) {
            unlockWithBiometrics();
        }
    }, [isBiometricsEnabled]);

    const handlePress = async (value: string) => {
        if (value === 'delete') {
            setPin(prev => prev.slice(0, -1));
            setError(false);
            return;
        }

        if (pin.length < 4) {
            const newPin = pin + value;
            setPin(newPin);

            if (newPin.length === 4) {
                // Determine if correct
                const isValid = await unlockWithPin(newPin);
                if (!isValid) {
                    setError(true);
                    triggerShake();
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 500);
                }
            }
        }
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
        ]).start();
    };

    const renderDot = (index: number) => {
        const filled = index < pin.length;
        return (
            <View
                key={index}
                style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    error && styles.dotError
                ]}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed-outline" size={48} color="#333" />
                </View>
                <Text style={styles.title}>Enter PIN</Text>

                <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                    {[0, 1, 2, 3].map(renderDot)}
                </Animated.View>

                <View style={styles.keypad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={styles.key}
                            onPress={() => handlePress(num.toString())}
                        >
                            <Text style={styles.keyText}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.key}
                        onPress={unlockWithBiometrics}
                        disabled={!isBiometricsEnabled}
                    >
                        {isBiometricsEnabled && <Ionicons name="finger-print" size={28} color="#333" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.key}
                        onPress={() => handlePress('0')}
                    >
                        <Text style={styles.keyText}>0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.key}
                        onPress={() => handlePress('delete')}
                    >
                        <Ionicons name="backspace-outline" size={28} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f2f2f7', // iOS grouped background color
        zIndex: 9999, // Ensure it's on top
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 30,
        color: '#000',
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 50,
        height: 20,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        marginHorizontal: 12,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#333',
    },
    dotError: {
        borderColor: 'red',
        backgroundColor: 'red',
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 280, // Adjust based on screen width
        justifyContent: 'space-between',
    },
    key: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '400',
        color: '#000',
    },
});

export default LockScreen;
