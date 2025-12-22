import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchClasses, getUserProfile, fetchSkills } from '../../lib/api';
import { useTheme } from '../../lib/theme';

export default function DashboardScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const loadData = useCallback(async () => {
        try {
            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

            const [userProfile, rawClasses, userSkills] = await Promise.all([
                getUserProfile(),
                fetchClasses(todayName),
                fetchSkills()
            ]);

            setProfile(userProfile);
            setSkills(userSkills || []);

            // PROCESSSING SCHEDULE
            if (rawClasses && rawClasses.length > 0) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                const processed = rawClasses.map((c: any) => {
                    const [sH, sM] = c.start_time.split(':').map(Number);
                    const [eH, eM] = c.end_time.split(':').map(Number);
                    const startMin = sH * 60 + sM;
                    const endMin = eH * 60 + eM;

                    let status = 'upcoming';
                    if (currentMinutes >= startMin && currentMinutes < endMin) {
                        status = 'active';
                    } else if (currentMinutes >= endMin) {
                        status = 'completed';
                    }
                    return { ...c, status, startMin };
                });

                // SORTING: Active first, then by time
                processed.sort((a: any, b: any) => {
                    if (a.status === 'active') return -1;
                    if (b.status === 'active') return 1;
                    return a.startMin - b.startMin;
                });

                setTodaysSchedule(processed);
            } else {
                setTodaysSchedule([]);
            }

        } catch (error) {
            console.error(error);
        }
    }, [currentTime]);

    // Timer for Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Auto-refresh logic
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const isWeekend = ['Saturday', 'Sunday'].includes(currentTime.toLocaleDateString('en-US', { weekday: 'long' }));

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
            >
                {/* Header: Profile & Greeting */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={[styles.avatarImage, { borderColor: colors.secondary }]} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                                    <Text style={[styles.avatarText, { color: colors.background }]}>{profile?.full_name?.[0] || 'S'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.greetingContainer}>
                            <Text style={[styles.greeting, { color: colors.subtext }]}>Good Morning,</Text>
                            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>{profile?.full_name || 'Student'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="notifications-none" size={26} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Date & Time Widget */}
                <View style={styles.timeWidget}>
                    <Text style={[styles.bigTime, { color: colors.text }]}>{formattedTime}</Text>
                    <Text style={[styles.dateLabel, { color: colors.subtext }]}>{formattedDate}</Text>
                </View>

                {/* Stats Cards: CGPA & Credits */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.danger }]}>
                        <View style={styles.statIcon}>
                            <FontAwesome5 name="chart-line" size={20} color={colors.background} />
                        </View>
                        <View>
                            <Text style={[styles.statNumber, { color: colors.background }]}>{profile?.gpa || '0.00'}</Text>
                            <Text style={[styles.statLabel, { color: colors.background }]}>CGPA</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.success }]}>
                        <View style={styles.statIcon}>
                            <FontAwesome5 name="medal" size={20} color={colors.background} />
                        </View>
                        <View>
                            <Text style={[styles.statNumber, { color: colors.background }]}>{profile?.credits_earned || '0'}</Text>
                            <Text style={[styles.statLabel, { color: colors.background }]}>Credits</Text>
                        </View>
                    </View>
                </View>

                {/* Today's Schedule Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>

                    {todaysSchedule.length > 0 ? (
                        todaysSchedule.map((item, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.classCard,
                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                    item.status === 'active' && [styles.activeClassCard, { borderColor: colors.success, backgroundColor: colors.surface }],
                                    item.status === 'completed' && { opacity: 0.6 }
                                ]}
                            >
                                <View style={[styles.classTimeBox, { backgroundColor: item.type === 'lab' ? colors.danger : colors.primary }]}>
                                    <Text style={[styles.classTimeBoxText, { color: colors.background }]}>
                                        {item.start_time?.slice(0, 5)}
                                    </Text>
                                    <Text style={[styles.classTimeBoxLabel, { color: colors.background }]}>
                                        {item.status === 'active' ? 'NOW' : 'Start'}
                                    </Text>
                                </View>
                                <View style={styles.classInfo}>
                                    <Text style={[styles.className, { color: colors.text }]}>{item.subject_name}</Text>
                                    <Text style={[styles.classDetail, { color: colors.subtext }]}>
                                        {item.room} • {item.slot_label}
                                    </Text>
                                    <View style={styles.tagRow}>
                                        <View style={[styles.typeTag, { backgroundColor: colors.surfaceHighlight }]}>
                                            <Text style={[styles.typeTagText, { color: colors.text }]}>{item.type}</Text>
                                        </View>
                                        {item.status === 'active' && (
                                            <View style={[styles.typeTag, { backgroundColor: colors.success, marginLeft: 8 }]}>
                                                <Text style={[styles.typeTagText, { color: colors.background }]}>ONGOING</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={[styles.emptyClassCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MaterialIcons name={isWeekend ? "beach-access" : "event-available"} size={40} color={colors.subtext} />
                            <Text style={[styles.emptyClassText, { color: colors.text }]}>
                                {isWeekend ? "Enjoy your Holiday!" : "No classes today"}
                            </Text>
                            <Text style={[styles.emptyClassSubText, { color: colors.subtext }]}>
                                {isWeekend ? "Relax and recharge." : "Time to focus on tasks."}
                            </Text>
                        </View>
                    )}
                </View>

                {/* My Skills Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>My Skills</Text>
                    {skills.length > 0 ? (
                        skills.map((skill) => (
                            <TouchableOpacity
                                key={skill.id}
                                style={[styles.skillWidget, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 }]}
                                onPress={() => router.push('/(tabs)/skills')}
                            >
                                <View style={styles.skillWidgetHeader}>
                                    <Text style={[styles.skillWidgetTitle, { color: colors.text }]}>{skill.title}</Text>
                                    <Text style={[styles.skillWidgetPercent, { color: skill.progress === 100 ? colors.success : colors.primary }]}>{skill.progress}%</Text>
                                </View>
                                <View style={[styles.skillWidgetBarBg, { backgroundColor: colors.surfaceHighlight }]}>
                                    <View
                                        style={[
                                            styles.skillWidgetBarFill,
                                            {
                                                width: `${skill.progress}%`,
                                                backgroundColor: skill.progress === 100 ? colors.success : colors.primary
                                            }
                                        ]}
                                    />
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <TouchableOpacity
                            style={[styles.emptyClassCard, { padding: 20 }]}
                            onPress={() => router.push('/(tabs)/skills')}
                        >
                            <Text style={{ color: colors.subtext }}>No skills yet. Tap to add!</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#11111B',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120, // Space for Custom Tab Bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#CBA6F7',
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#CBA6F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#11111B',
    },
    greetingContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        color: '#A6ADC8',
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#CDD6F4',
    },
    notificationBtn: {
        padding: 10,
        backgroundColor: '#1E1E2E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#313244',
    },
    timeWidget: {
        alignItems: 'center',
        marginBottom: 30,
        paddingVertical: 10,
    },
    bigTime: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#CDD6F4',
        includeFontPadding: false,
    },
    dateLabel: {
        fontSize: 16,
        color: '#A6ADC8',
        marginTop: -5,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        padding: 15,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#11111B',
    },
    statLabel: {
        fontSize: 12,
        color: '#11111B',
        opacity: 0.8,
        fontWeight: '600',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#CDD6F4',
        marginBottom: 15,
    },
    classCard: {
        flexDirection: 'row',
        backgroundColor: '#1E1E2E',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#313244',
        marginBottom: 10,
    },
    activeClassCard: {
        borderColor: '#A6E3A1',
        borderWidth: 2,
        backgroundColor: 'rgba(166, 227, 161, 0.05)',
    },
    classTimeBox: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginRight: 15,
    },
    classTimeBoxText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#11111B',
    },
    classTimeBoxLabel: {
        fontSize: 10,
        color: '#11111B',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#CDD6F4',
        marginBottom: 4,
    },
    classDetail: {
        fontSize: 14,
        color: '#A6ADC8',
        marginBottom: 8,
    },
    tagRow: {
        flexDirection: 'row',
    },
    typeTag: {
        backgroundColor: '#313244',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeTagText: {
        color: '#CDD6F4',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyClassCard: {
        backgroundColor: '#1E1E2E',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#313244',
        borderStyle: 'dashed',
    },
    emptyClassText: {
        color: '#CDD6F4',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    emptyClassSubText: {
        color: '#A6ADC8',
        fontSize: 14,
        marginTop: 5,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E2E',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
    },
    taskIcon: {
        marginRight: 15,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        color: '#CDD6F4',
        marginBottom: 2,
    },
    taskDue: {
        fontSize: 12,
        color: '#F38BA8',
    },
    skillWidget: {
        backgroundColor: '#1E1E2E',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#313244',
    },
    skillWidgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    skillWidgetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#CDD6F4',
    },
    skillWidgetPercent: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#89B4FA',
    },
    skillWidgetBarBg: {
        height: 6,
        backgroundColor: '#313244',
        borderRadius: 3,
        overflow: 'hidden',
    },
    skillWidgetBarFill: {
        height: '100%',
        backgroundColor: '#89B4FA',
        borderRadius: 3,
    },
});
