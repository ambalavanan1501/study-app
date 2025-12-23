import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import GlassCard from '../components/GlassCard';
import { fetchGradeDetails, updateGradeDetails, GradeDetails } from '../lib/grades';

const GRADES = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N'] as const;

export default function CGPASettingsScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [details, setDetails] = useState<GradeDetails>({
        credits_registered: 0,
        credits_earned: 0,
        cgpa: 0,
        grade_counts: { s: 0, a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, n: 0 }
    });

    // Local string state for inputs to allow decimals (e.g. "4." or ".5")
    const [inputs, setInputs] = useState({
        credits_registered: '0',
        credits_earned: '0',
        cgpa: '0'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchGradeDetails();
        if (data) {
            setDetails(data);
            setInputs({
                credits_registered: data.credits_registered?.toString() || '0',
                credits_earned: data.credits_earned?.toString() || '0',
                cgpa: data.cgpa?.toString() || '0'
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);

        // Parse inputs to numbers before saving
        const finalDetails = {
            ...details,
            credits_registered: parseFloat(inputs.credits_registered) || 0,
            credits_earned: parseFloat(inputs.credits_earned) || 0,
            cgpa: parseFloat(inputs.cgpa) || 0,
        };

        const success = await updateGradeDetails(finalDetails);
        setSaving(false);
        if (success) {
            Alert.alert('Success', 'CGPA details updated!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Error', 'Failed to save details.');
        }
    };

    const incrementGrade = (grade: keyof typeof details.grade_counts) => {
        setDetails(prev => ({
            ...prev,
            grade_counts: {
                ...prev.grade_counts,
                [grade]: prev.grade_counts[grade] + 1
            }
        }));
    };

    const decrementGrade = (grade: keyof typeof details.grade_counts) => {
        setDetails(prev => ({
            ...prev,
            grade_counts: {
                ...prev.grade_counts,
                [grade]: Math.max(0, prev.grade_counts[grade] - 1)
            }
        }));
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[theme === 'dark' ? colors.primary + '30' : colors.primary + '10', 'transparent']}
                style={styles.backgroundGradient}
            />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Edit Usage</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Academic Stats</Text>
                {/* Top Stat Cards Input */}
                <View style={styles.statsRow}>
                    <GlassCard style={[styles.statCard, { backgroundColor: '#4CAF50' }]} intensity={20} tint="light">
                        <TextInput
                            style={styles.statInput}
                            value={inputs.credits_registered}
                            onChangeText={(t) => setInputs(prev => ({ ...prev, credits_registered: t }))}
                            keyboardType="decimal-pad"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                        />
                        <Text style={styles.statLabel}>Credits Reg.</Text>
                    </GlassCard>

                    <GlassCard style={[styles.statCard, { backgroundColor: '#3F51B5' }]} intensity={20} tint="light">
                        <TextInput
                            style={styles.statInput}
                            value={inputs.credits_earned}
                            onChangeText={(t) => setInputs(prev => ({ ...prev, credits_earned: t }))}
                            keyboardType="decimal-pad"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                        />
                        <Text style={styles.statLabel}>Credits Earned</Text>
                    </GlassCard>

                    <GlassCard style={[styles.statCard, { backgroundColor: '#E91E63' }]} intensity={20} tint="light">
                        <TextInput
                            style={styles.statInput}
                            value={inputs.cgpa}
                            onChangeText={(t) => setInputs(prev => ({ ...prev, cgpa: t }))}
                            keyboardType="decimal-pad"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                        />
                        <Text style={styles.statLabel}>CGPA</Text>
                    </GlassCard>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.subtext, marginTop: 20 }]}>Grade Distribution</Text>
                <Text style={[styles.helperText, { color: colors.subtext }]}>Tap + or - to update counts</Text>

                {/* Grade Table */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { color: colors.text, flex: 1, textAlign: 'center' }]}>Grade</Text>
                    <Text style={[styles.tableHeaderText, { color: colors.text, flex: 1, textAlign: 'center' }]}>Count</Text>
                </View>

                {GRADES.map((grade) => {
                    const count = details.grade_counts[grade.toLowerCase() as keyof typeof details.grade_counts] || 0;

                    const gradeColors: { [key: string]: string } = {
                        'S': '#2E7D32', 'A': '#1565C0', 'B': '#A0522D', 'C': '#9E9D24',
                        'D': '#A52A2A', 'E': '#6A1B9A', 'F': '#880E4F', 'N': '#616161'
                    };
                    const bgColor = gradeColors[grade] || colors.surface;

                    return (
                        <View key={grade} style={[styles.tableRow, { backgroundColor: bgColor }]}>
                            <Text style={styles.gradeText}>{grade}</Text>

                            <View style={styles.counterControl}>
                                <TouchableOpacity onPress={() => decrementGrade(grade.toLowerCase() as any)} style={styles.counterBtn}>
                                    <MaterialIcons name="remove" size={20} color="#FFF" />
                                </TouchableOpacity>

                                <Text style={styles.countText}>{count}</Text>

                                <TouchableOpacity onPress={() => incrementGrade(grade.toLowerCase() as any)} style={styles.counterBtn}>
                                    <MaterialIcons name="add" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 400, opacity: 0.3
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 1,
    },
    helperText: {
        fontSize: 12,
        marginBottom: 10,
        fontStyle: 'italic',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statCard: {
        width: '31%',
        aspectRatio: 0.9,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    statInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 5,
        minWidth: 50,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        fontWeight: '600',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 5,
    },
    tableHeaderText: {
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 30,
        marginBottom: 2,
        borderRadius: 5,
    },
    gradeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        width: '40%',
        textAlign: 'center',
    },
    counterControl: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '40%',
        justifyContent: 'center',
        gap: 15,
    },
    countText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        minWidth: 25,
        textAlign: 'center',
    },
    counterBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
    }
});
