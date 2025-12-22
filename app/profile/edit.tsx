import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getUserProfile, updateProfile, uploadProfileImage } from '../../lib/api';

export default function EditProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        full_name: '',
        university: '',
        program: '',
        gpa: '',
        credits_earned: '',
        avatar_url: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const data = await getUserProfile();
        if (data) {
            setForm({
                full_name: data.full_name || '',
                university: data.university || '',
                program: data.program || '',
                gpa: data.gpa?.toString() || '',
                credits_earned: data.credits_earned?.toString() || '',
                avatar_url: data.avatar_url || '',
            });
        }
        setFetching(false);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setLoading(true);
            try {
                const publicUrl = await uploadProfileImage(result.assets[0].base64);
                setForm({ ...form, avatar_url: publicUrl });
            } catch (error: any) {
                Alert.alert('Upload Failed', error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!form.full_name || !form.university || !form.program) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await updateProfile({
                full_name: form.full_name,
                university: form.university,
                program: form.program,
                gpa: form.gpa ? parseFloat(form.gpa) : null,
                credits_earned: form.credits_earned ? parseFloat(form.credits_earned) : 0,
                avatar_url: form.avatar_url,
            });

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#89B4FA" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                title: 'Edit Profile',
                headerStyle: { backgroundColor: '#11111B' },
                headerTintColor: '#CDD6F4',
            }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {form.avatar_url ? (
                            <Image source={{ uri: form.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{form.full_name?.[0] || 'S'}</Text>
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <MaterialIcons name="camera-alt" size={20} color="#11111B" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. John Doe"
                        placeholderTextColor="#6C7086"
                        value={form.full_name}
                        onChangeText={(text) => setForm({ ...form, full_name: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>University *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. VIT"
                        placeholderTextColor="#6C7086"
                        value={form.university}
                        onChangeText={(text) => setForm({ ...form, university: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Program / Major *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. B.Tech CSE"
                        placeholderTextColor="#6C7086"
                        value={form.program}
                        onChangeText={(text) => setForm({ ...form, program: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Current CGPA</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 9.0"
                        placeholderTextColor="#6C7086"
                        keyboardType="numeric"
                        value={form.gpa}
                        onChangeText={(text) => setForm({ ...form, gpa: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Credits Earned</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 63.5"
                        placeholderTextColor="#6C7086"
                        keyboardType="numeric"
                        value={form.credits_earned}
                        onChangeText={(text) => setForm({ ...form, credits_earned: text })}
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
                        <Text style={styles.saveBtnText}>Save Changes</Text>
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
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#313244',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        color: '#A6ADC8',
        fontWeight: 'bold',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#89B4FA',
        padding: 8,
        borderRadius: 20,
    },
    changePhotoText: {
        color: '#89B4FA',
        fontSize: 16,
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 20,
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
    saveBtn: {
        backgroundColor: '#89B4FA',
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
