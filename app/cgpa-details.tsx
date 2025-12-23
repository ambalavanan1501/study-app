import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import GlassCard from '../components/GlassCard';
import { fetchGradeDetails, GradeDetails } from '../lib/grades';

const GRADES = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N'] as const;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CGPADetailsScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [details, setDetails] = useState<GradeDetails>({
        credits_registered: 0,
        credits_earned: 0,
        cgpa: 0,
        grade_counts: { s: 0, a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, n: 0 }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchGradeDetails();
        if (data) {
            setDetails(data);
        }
        setLoading(false);
    };

    // Find max count for bar scaling
    const maxCount = Math.max(...Object.values(details.grade_counts), 1);

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
                colors={[theme === 'dark' ? colors.primary + '20' : colors.primary + '10', 'transparent']}
                style={styles.backgroundGradient}
            />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <GlassCard style={styles.iconButton} intensity={30}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </GlassCard>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Performance</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero CGPA Card */}
                <View style={{ alignItems: 'center', marginBottom: 25 }}>
                    <GlassCard
                        style={[styles.heroCard, { borderColor: colors.primary + '50' }]}
                        intensity={40}
                        tint={theme === 'dark' ? 'dark' : 'light'}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'transparent']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Text style={[styles.heroLabel, { color: colors.subtext }]}>Current CGPA</Text>
                        <Text style={[styles.heroValue, { color: colors.primary, textShadowColor: colors.primary + '80' }]}>
                            {details.cgpa.toFixed(2)}
                        </Text>
                    </GlassCard>
                </View>

                {/* Secondary Stats */}
                <View style={styles.statsRow}>
                    <GlassCard style={styles.statCard} intensity={25}>
                        <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
                            <Ionicons name="book" size={20} color="#4CAF50" />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{details.credits_registered}</Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>Credits Reg.</Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard} intensity={25}>
                        <View style={[styles.iconContainer, { backgroundColor: '#3F51B5' + '20' }]}>
                            <Ionicons name="trophy" size={20} color="#3F51B5" />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{details.credits_earned}</Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>Credits Earned</Text>
                    </GlassCard>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Grade Distribution</Text>

                {/* Histogram */}
                <GlassCard style={styles.chartContainer} intensity={20}>
                    {GRADES.map((grade, index) => {
                        const count = details.grade_counts[grade.toLowerCase() as keyof typeof details.grade_counts] || 0;
                        const percentage = (count / maxCount) * 100;

                        const gradeColors: { [key: string]: string } = {
                            'S': '#2E7D32', 'A': '#1565C0', 'B': '#A0522D', 'C': '#9E9D24',
                            'D': '#A52A2A', 'E': '#6A1B9A', 'F': '#880E4F', 'N': '#616161'
                        };
                        const barColor = gradeColors[grade] || colors.surface;

                        return (
                            <View key={grade} style={styles.chartRow}>
                                <View style={styles.rowLabelContainer}>
                                    <View style={[styles.gradeBadge, { backgroundColor: barColor }]}>
                                        <Text style={styles.gradeBadgeText}>{grade}</Text>
                                    </View>
                                </View>

                                <View style={styles.barTrack}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            {
                                                width: `${percentage}%`,
                                                backgroundColor: barColor,
                                                opacity: count > 0 ? 1 : 0.3
                                            }
                                        ]}
                                    />
                                </View>

                                <Text style={[styles.countText, { color: colors.text }]}>{count}</Text>
                            </View>
                        );
                    })}
                </GlassCard>

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
        top: 0, left: 0, right: 0, height: 600,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
    },
    iconButton: {
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    heroCard: {
        width: 200,
        height: 200,
        borderRadius: 100, // Circle
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 10,
    },
    heroLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    heroValue: {
        fontSize: 56,
        fontWeight: 'bold',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 40,
    },
    statCard: {
        width: '45%',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        marginLeft: 5,
    },
    chartContainer: {
        borderRadius: 25,
        padding: 20,
        paddingVertical: 25,
        overflow: 'hidden',
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    rowLabelContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    gradeBadge: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradeBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    barTrack: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        marginHorizontal: 15,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    countText: {
        width: 25,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: '600',
    }
});
