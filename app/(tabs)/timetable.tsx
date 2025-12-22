import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { fetchClasses } from '../../lib/api';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../lib/theme';

const DAY_MAP: { [key: string]: string } = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
};

export default function TimetableScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const [weekDays, setWeekDays] = useState<Date[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [classes, setClasses] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
        const days = Array.from({ length: 5 }).map((_, i) => addDays(start, i));
        setWeekDays(days);

        // Ensure selectedDate is today visually
        setSelectedDate(new Date());
    }, []);

    const loadClasses = useCallback(async () => {
        const dayStr = format(selectedDate, 'EEE');
        const fullDayName = DAY_MAP[dayStr] || dayStr;
        const data = await fetchClasses(fullDayName);

        // Sorting Logic: Active -> Upcoming -> Completed
        if (data && data.length > 0) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const processed = data.map((c: any) => {
                const [sH, sM] = c.start_time.split(':').map(Number);
                const [eH, eM] = c.end_time.split(':').map(Number);
                const startMin = sH * 60 + sM;
                const endMin = eH * 60 + eM;

                let status = 'upcoming';
                // Only mark active if selected date matches today
                if (isSameDay(selectedDate, now)) {
                    if (currentMinutes >= startMin && currentMinutes < endMin) {
                        status = 'active';
                    } else if (currentMinutes >= endMin) {
                        status = 'completed';
                    }
                }

                return { ...c, status, startMin };
            });

            // Sort
            processed.sort((a: any, b: any) => {
                if (a.status === 'active') return -1;
                if (b.status === 'active') return 1;
                return a.startMin - b.startMin;
            });
            setClasses(processed);
        } else {
            setClasses([]);
        }

    }, [selectedDate]);

    useFocusEffect(
        useCallback(() => {
            loadClasses();
        }, [loadClasses])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadClasses();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Timetable</Text>
                <TouchableOpacity onPress={() => router.push('/add-course')}>
                    <MaterialIcons name="add" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Week Calendar Strip */}
            <View style={styles.calendarStrip}>
                {weekDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayItem,
                                isSelected && [styles.selectedDayItem, { backgroundColor: colors.primary }],
                                isToday && !isSelected && [styles.todayItem, { borderColor: colors.primary }]
                            ]}
                            onPress={() => setSelectedDate(date)}
                        >
                            <Text style={[
                                styles.dayName,
                                { color: colors.subtext, fontSize: 16, fontWeight: 'bold', marginBottom: 0 },
                                isSelected && { color: colors.background }
                            ]}>
                                {format(date, 'EEE')}
                            </Text>
                            {/* Date Number removed as per request */}

                            {/* Dot for today */}
                            {isToday && <View style={[
                                styles.todayDot,
                                { backgroundColor: isSelected ? colors.background : colors.primary }
                            ]} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={classes}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: colors.subtext }]}>No classes scheduled</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        item.status === 'active' && [styles.activeCard, { borderColor: colors.success, backgroundColor: colors.surface }],
                        item.status === 'completed' && { opacity: 0.6 }
                    ]}>
                        <View style={[styles.timeStrip, { backgroundColor: item.type === 'lab' ? colors.danger : colors.primary }]} />

                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.subject, { color: colors.text }]}>{item.subject_name}</Text>
                                <View style={[styles.typeBadge, { backgroundColor: colors.surfaceHighlight }]}>
                                    <Text style={[styles.typeText, { color: colors.text }]}>{item.type}</Text>
                                </View>
                            </View>

                            <Text style={[styles.subTitle, { color: colors.subtext }]}>{item.room} • {item.slot_label}</Text>

                            <View style={styles.timeRow}>
                                <MaterialIcons name="access-time" size={16} color={colors.subtext} />
                                <Text style={[styles.timeText, { color: colors.subtext }]}>
                                    {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                                </Text>
                            </View>

                            {item.status === 'active' && (
                                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                                    <Text style={[styles.statusText, { color: colors.background }]}>ONGOING</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    calendarStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    dayItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    selectedDayItem: {
        // dynamic bg
    },
    todayItem: {
        borderWidth: 1,
    },
    dayName: {
        fontSize: 12,
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for Custom Tab Bar
    },
    card: {
        flexDirection: 'row',
        borderRadius: 15,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        // dynamic bg and border
    },
    activeCard: {
        borderWidth: 2,
    },
    timeStrip: {
        width: 6,
        // dynamic bg
    },
    cardContent: {
        flex: 1,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    subject: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    subTitle: {
        fontSize: 14,
        marginBottom: 10,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        marginLeft: 6,
        fontSize: 14,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
    }
});
