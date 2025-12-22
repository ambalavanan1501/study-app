import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SetupProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        full_name: '',
        university: '',
        program: '',
        gpa: '',
    });

    const handleSave = async () => {
        if (!form.full_name || !form.university || !form.program) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            Alert.alert('Error', 'No user logged in');
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: form.full_name,
            university: form.university,
            program: form.program,
            gpa: form.gpa ? parseFloat(form.gpa) : null,
            attendance_percentage: 100, // Default start
            credits_earned: 0, // Default start
        });

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(tabs)/dashboard');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Setup Profile</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. John Doe"
                        placeholderTextColor="#6C7086"
                        value={form.full_name}
                        onChangeText={(text) => setForm({ ...form, full_name: text })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>University *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. VIT"
                        placeholderTextColor="#6C7086"
                        value={form.university}
                        onChangeText={(text) => setForm({ ...form, university: text })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Program / Major *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. B.Tech CSE"
                        placeholderTextColor="#6C7086"
                        value={form.program}
                        onChangeText={(text) => setForm({ ...form, program: text })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Current CGPA (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 9.0"
                        placeholderTextColor="#6C7086"
                        keyboardType="numeric"
                        value={form.gpa}
                        onChangeText={(text) => setForm({ ...form, gpa: text })}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#11111B" />
                    ) : (
                        <Text style={styles.buttonText}>Complete Setup</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#11111B',
    },
    content: {
        padding: 24,
        justifyContent: 'center',
        flexGrow: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#CDD6F4',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#A6ADC8',
        marginBottom: 32,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: '#CDD6F4',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1E1E2E',
        borderWidth: 1,
        borderColor: '#313244',
        borderRadius: 12,
        padding: 16,
        color: '#CDD6F4',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#A6E3A1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#11111B',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
