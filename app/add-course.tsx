import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { CourseInput, parseCourseEntries } from '../lib/timetable-parser';
import { saveTimeTableEntry } from '../lib/api';

export default function AddCourseScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        subject_name: '',
        subject_code: '',
        type: 'theory' as 'theory' | 'lab',
        slot: '',
        room_number: '',
        credit: '', // Changed to string for input handling
    });

    const handleSave = async () => {
        if (!form.subject_name || !form.slot || !form.room_number) { // credit is optional? or check string
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const { entries, errors } = parseCourseEntries([{
                subject_name: form.subject_name,
                subject_code: form.subject_code,
                type: form.type,
                slot: form.slot,
                room_number: form.room_number,
                credit: form.credit ? parseFloat(form.credit) : 0, // Parse here
            }]);

            if (errors.length > 0) {
                Alert.alert('Invalid Slot', errors.join('\n'));
                setLoading(false);
                return;
            }

            // Save all generated entries
            for (const entry of entries) {
                await saveTimeTableEntry(entry);
            }

            Alert.alert('Success', 'Course added successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to save course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{
                title: 'Add Course',
                headerStyle: { backgroundColor: '#11111B' },
                headerTintColor: '#CDD6F4',
            }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Subject Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Calculus"
                        placeholderTextColor="#6C7086"
                        value={form.subject_name}
                        onChangeText={(text) => setForm({ ...form, subject_name: text })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Subject Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. MAT1001"
                            placeholderTextColor="#6C7086"
                            value={form.subject_code}
                            onChangeText={(text) => setForm({ ...form, subject_code: text })}
                        />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Credits</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 4"
                            placeholderTextColor="#6C7086"
                            keyboardType="decimal-pad"
                            value={form.credit}
                            onChangeText={(text) => setForm({ ...form, credit: text })}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Type</Text>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeBtn, form.type === 'theory' && styles.activeTypeBtn]}
                            onPress={() => setForm({ ...form, type: 'theory' })}
                        >
                            <Text style={[styles.typeText, form.type === 'theory' && styles.activeTypeText]}>Theory</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, form.type === 'lab' && styles.activeTypeBtn]}
                            onPress={() => setForm({ ...form, type: 'lab' })}
                        >
                            <Text style={[styles.typeText, form.type === 'lab' && styles.activeTypeText]}>Lab</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Slot (e.g. A1+TA1 or L1+L2)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter slot code"
                        placeholderTextColor="#6C7086"
                        value={form.slot}
                        autoCapitalize="characters"
                        onChangeText={(text) => setForm({ ...form, slot: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Room Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. SJT 101"
                        placeholderTextColor="#6C7086"
                        value={form.room_number}
                        onChangeText={(text) => setForm({ ...form, room_number: text })}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#11111B" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Course</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#11111B',
    },
    content: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        color: '#A6ADC8',
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1E1E2E',
        color: '#CDD6F4',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#313244',
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: '#1E1E2E',
        borderRadius: 12,
        padding: 4,
    },
    typeBtn: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTypeBtn: {
        backgroundColor: '#89B4FA',
    },
    typeText: {
        color: '#A6ADC8',
        fontWeight: '600',
    },
    activeTypeText: {
        color: '#11111B',
    },
    saveBtn: {
        backgroundColor: '#A6E3A1',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    saveBtnText: {
        color: '#11111B',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
