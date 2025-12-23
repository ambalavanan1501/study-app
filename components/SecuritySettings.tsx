import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useAppLock } from '../contexts/AppLockContext';
import { Ionicons } from '@expo/vector-icons';
import ThemeSelector from './ThemeSelector';

const SecuritySettings = () => {
    const { hasPin, isBiometricsEnabled, setPin, toggleBiometrics } = useAppLock();
    const [modalVisible, setModalVisible] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const handleSavePin = async () => {
        if (newPin.length !== 4) {
            Alert.alert('Invalid PIN', 'PIN must be 4 digits.');
            return;
        }
        if (newPin !== confirmPin) {
            Alert.alert('Mismatch', 'PINs do not match.');
            return;
        }
        await setPin(newPin);
        setModalVisible(false);
        setNewPin('');
        setConfirmPin('');
        Alert.alert('Success', 'PIN set successfully.');
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Appearance</Text>
                <ThemeSelector />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>App Security</Text>

                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>{hasPin ? 'Change PIN' : 'Set PIN'}</Text>
                        <Text style={styles.subtext}>{hasPin ? 'PIN is currently set' : 'Protect your app with a PIN'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.button}>
                        <Text style={styles.buttonText}>{hasPin ? 'Change' : 'Setup'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Unlock with Biometrics</Text>
                        <Text style={styles.subtext}>Use FaceID or Fingerprint</Text>
                    </View>
                    <Switch
                        value={isBiometricsEnabled}
                        onValueChange={toggleBiometrics}
                        trackColor={{ false: '#767577', true: '#4CAF50' }}
                        disabled={!hasPin} // Require PIN first
                    />
                </View>
            </View>

            {/* Set PIN Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set New PIN</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter 4-digit PIN"
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            value={newPin}
                            onChangeText={setNewPin}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm PIN"
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            value={confirmPin}
                            onChangeText={setConfirmPin}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButtonCancel}>
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSavePin} style={styles.modalButtonSave}>
                                <Text style={styles.modalButtonTextSave}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    subtext: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    button: {
        backgroundColor: '#f0f0f7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    buttonText: {
        color: '#007AFF',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 18,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButtonCancel: {
        flex: 1,
        padding: 12,
        marginRight: 8,
        alignItems: 'center',
    },
    modalButtonSave: {
        flex: 1,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        marginLeft: 8,
        alignItems: 'center',
    },
    modalButtonTextCancel: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    modalButtonTextSave: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default SecuritySettings;
