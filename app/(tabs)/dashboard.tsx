import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchClasses, getUserProfile, fetchSkills } from '../../lib/api';
import { useTheme } from '../../lib/theme';
import GlassCard from '../../components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { scheduleClassReminder, syncWeekReminders } from '../../lib/notifications';
import { updateWidget } from '../../lib/data-sync';

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

            const [userProfile, allClasses, userSkills] = await Promise.all([
                getUserProfile(),
                fetchClasses(), // Fetch all classes for week sync
                fetchSkills()
            ]);

            setProfile(userProfile);
            setSkills(userSkills || []);

            // Sync notification reminders for the ENTIRE week
            syncWeekReminders(allClasses);
            updateWidget(allClasses);

            // Filter for TODAY'S schedule UI
            const rawClasses = allClasses.filter((c: any) => c.day === todayName);

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
            {/* Ambient Background Gradient */}
            <LinearGradient
                colors={[theme === 'dark' ? colors.primary + '40' : colors.primary + '20', 'transparent']}
                style={styles.backgroundGradient}
            />

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
                            <Text style={[styles.greeting, { color: colors.subtext }]}>WELCOME BACK</Text>
                            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>{profile?.full_name || 'Student'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={async () => {
                            await scheduleClassReminder("Test Notification", "This is a test reminder from your Study App!", 2);
                            alert("Scheduled test notification for 2 seconds from now!");
                        }}
                    >
                        <MaterialIcons name="notifications-none" size={26} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Hero Time Widget - Minimalist */}
                <View style={styles.timeContainer}>
                    <Text style={[styles.bigTime, { color: colors.text }]}>{formattedTime}</Text>
                    <Text style={[styles.dateLabel, { color: colors.subtext }]}>{formattedDate}</Text>
                </View>

                {/* Next Class / Active Class */}
                <View style={styles.nextClassContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Current Priority</Text>
                    {todaysSchedule.length > 0 ? (
                        <TouchableOpacity onPress={() => router.push('/(tabs)/timetable')}>
                            <GlassCard style={styles.glassCard} intensity={40}>
                                <View style={styles.nextClassContent}>
                                    <View style={styles.nextClassTime}>
                                        <Text style={[styles.nextClassTimeText, { color: colors.primary }]}>
                                            {todaysSchedule[0].start_time?.slice(0, 5)}
                                        </Text>
                                        <Text style={[styles.nextClassTimeLabel, { color: colors.text }]}>
                                            {todaysSchedule[0].status === 'active' ? 'NOW' : 'NEXT'}
                                        </Text>
                                    </View>
                                    <View style={styles.nextClassInfo}>
                                        <Text style={[styles.nextClassName, { color: colors.text }]}>{todaysSchedule[0].subject_name}</Text>
                                        <Text style={[styles.nextClassDetail, { color: colors.subtext }]}>
                                            {todaysSchedule[0].room} • {todaysSchedule[0].type}
                                        </Text>
                                        {/* Progress Bar Simulation */}
                                        <View style={styles.nextClassProgressBar}>
                                            <View style={[styles.nextClassProgressFill, { backgroundColor: colors.primary, width: '45%' }]} />
                                        </View>
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.noClassContainer}>
                            <Text style={{ color: colors.subtext }}>No classes today. Time to upskill.</Text>
                        </View>
                    )}
                </View>

                {/* Quick Stats Row - Glass Cards */}
                <View style={styles.statsRow}>
                    <GlassCard style={styles.statCard} intensity={30} tint={theme === 'dark' ? 'dark' : 'light'}>
                        <MaterialIcons name="grade" size={24} color={colors.warning} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{profile?.gpa || '0.00'}</Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>CGPA</Text>
                    </GlassCard>
                    <GlassCard style={styles.statCard} intensity={30} tint={theme === 'dark' ? 'dark' : 'light'}>
                        <MaterialIcons name="check-circle" size={24} color={colors.success} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{profile?.credits_earned || '0'}</Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>CREDITS</Text>
                    </GlassCard>
                </View>

                {/* Today's Schedule Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/timetable')}>
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {todaysSchedule.length > 0 ? (
                        todaysSchedule.map((item, index) => (
                            <TouchableOpacity key={index} onPress={() => router.push('/(tabs)/timetable')}>
                                <GlassCard
                                    style={[
                                        styles.classCard,
                                        item.status === 'active' && styles.activeClassCard,
                                        item.status === 'completed' && { opacity: 0.6 }
                                    ]}
                                    intensity={20}
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
                                </GlassCard>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.noClassContainer}>
                            <Text style={{ color: colors.subtext }}>No classes today.</Text>
                        </View>
                    )}
                </View>

                {/* Skills Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Skill Progress</Text>
                    {skills.map((skill) => (
                        <GlassCard key={skill.id} style={styles.skillItem} intensity={25}>
                            <View style={styles.skillInfo}>
                                <Text style={[styles.skillTitle, { color: colors.text }]}>{skill.title}</Text>
                                <View style={styles.skillBarBg}>
                                    <View style={[styles.skillBarFill, { width: `${skill.progress}%`, backgroundColor: colors.secondary }]} />
                                </View>
                            </View>
                            <Text style={[styles.skillPercent, { color: colors.text }]}>{skill.progress}%</Text>
                        </GlassCard>
                    ))}
                    {skills.length === 0 && (
                        <TouchableOpacity onPress={() => router.push('/(tabs)/skills')}>
                            <Text style={{ color: colors.primary, textAlign: 'center' }}>+ Add a Skill</Text>
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
        // Background color handled by inline style
    },
    // Adding a gradient background effect (simulated with View)
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 400,
        opacity: 0.3,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        borderWidth: 2,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    greetingContainer: {
        flexDirection: 'column',
    },
    greeting: {
        fontSize: 14,
        letterSpacing: 0.5,
    },
    username: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },

    // Hero Time Section
    timeContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingVertical: 20,
    },
    bigTime: {
        fontSize: 42,
        fontWeight: '200', // Thin futuristic font weight
        color: '#fff',
        includeFontPadding: false,
    },
    dateLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        marginTop: -5,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },


    section: {
        marginBottom: 25,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    classCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    activeClassCard: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
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
    },
    classTimeBoxLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    classDetail: {
        fontSize: 12,
        marginBottom: 6,
    },
    tagRow: {
        flexDirection: 'row',
    },
    typeTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Next Class Glass Card
    nextClassContainer: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 15,
        opacity: 0.8,
    },
    glassCard: {
        borderRadius: 24,
    },
    nextClassContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextClassTime: {
        alignItems: 'center',
        paddingRight: 15,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
        marginRight: 15,
    },
    nextClassTimeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    nextClassTimeLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        opacity: 0.7,
        marginTop: 2,
    },
    nextClassInfo: {
        flex: 1,
    },
    nextClassName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    nextClassDetail: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 8,
    },
    nextClassProgressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        width: '100%',
        overflow: 'hidden',
    },
    nextClassProgressFill: {
        height: '100%',
        borderRadius: 2,
    },

    // Quick Stats Row
    statsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    statCard: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    statLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.7,
    },

    // Skills
    skillItem: {
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    skillInfo: {
        flex: 1,
    },
    skillTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    skillBarBg: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    skillBarFill: {
        height: '100%',
    },
    skillPercent: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: 'bold',
    },
    noClassContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
    }
});
