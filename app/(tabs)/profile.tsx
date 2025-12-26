import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserProfile } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../lib/theme';
import { sendTestNotification } from '../../lib/notifications';
import { exportTimetable, importTimetable } from '../../lib/data-sync';

export default function ProfileScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { theme, toggleTheme, colors } = useTheme();
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadProfile = async () => {
        const data = await getUserProfile();
        setProfile(data);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: signOut }
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
            >
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>

                <View style={styles.profileHeader}>
                    <View style={[styles.avatarContainer, { backgroundColor: colors.secondary }]}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <Text style={[styles.avatarText, { color: colors.background }]}>{profile?.full_name?.[0] || 'S'}</Text>
                        )}
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'Student Name'}</Text>
                    <Text style={[styles.role, { color: colors.subtext }]}>{profile?.program || 'Program Not Set'}</Text>
                    <Text style={[styles.university, { color: colors.primary }]}>{profile?.university || 'University Not Set'}</Text>

                    <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: colors.secondary }]}
                        onPress={() => router.push('/profile/edit')}
                    >
                        <MaterialIcons name="edit" size={16} color={colors.background} />
                        <Text style={[styles.editBtnText, { color: colors.background }]}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{profile?.gpa || '0.00'}</Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>CGPA</Text>
                    </View>
                    <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: colors.surfaceHighlight }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{profile?.credits_earned || '0'}</Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>Credits</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => router.push('/add-course')}
                >
                    <MaterialIcons name="add-circle-outline" size={24} color={colors.background} />
                    <Text style={[styles.actionBtnText, { color: colors.background }]}>Add Course / Timetable</Text>
                </TouchableOpacity>

                <View style={[styles.menu, { backgroundColor: colors.surface }]}>
                    <View style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}>
                        <MaterialIcons name={theme === 'dark' ? "dark-mode" : "light-mode"} size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor={theme === 'dark' ? colors.text : '#f4f3f4'}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={() => router.push('/courses/manage')}
                    >
                        <MaterialIcons name="list-alt" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>Manage Courses</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={() => router.push('/security-settings')}
                    >
                        <MaterialIcons name="security" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>App Security</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={() => router.push('/cgpa-settings')}
                    >
                        <MaterialIcons name="graphic-eq" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>CGPA Settings</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={exportTimetable}
                    >
                        <MaterialIcons name="backup" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>Backup Timetable (Export)</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>


                    <View style={[styles.sectionHeader, { borderBottomColor: colors.surfaceHighlight }]}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Widget Settings</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={async () => {
                            try {
                                const classes = await import('../../lib/api').then(m => m.fetchClasses());
                                const { updateWidget } = await import('../../lib/data-sync');
                                updateWidget(classes);
                                Alert.alert('Sync Complete', 'Widget data has been refreshed.');
                            } catch (e) {
                                Alert.alert('Sync Failed', 'Could not sync data to widget.');
                                console.error(e);
                            }
                        }}
                    >
                        <MaterialIcons name="sync" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>Force Sync to Widget</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={importTimetable}
                    >
                        <MaterialIcons name="restore" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>Restore / Widget Import</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomColor: colors.surfaceHighlight }]}
                        onPress={() => sendTestNotification('web- development', 'SJTG05', '8:00 AM')}
                    >
                        <MaterialIcons name="notification-important" size={24} color={colors.subtext} />
                        <Text style={[styles.menuText, { color: colors.text }]}>Test Notification</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomWidth: 0 }]}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={24} color={colors.danger} />
                        <Text style={[styles.menuText, { color: colors.danger }]}>Logout</Text>
                    </TouchableOpacity>
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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#CDD6F4',
        padding: 20,
        paddingBottom: 0,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 120, // Space for Custom Tab Bar
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#CBA6F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#11111B',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#CDD6F4',
        marginBottom: 5,
    },
    role: {
        fontSize: 16,
        color: '#A6ADC8',
        marginBottom: 5,
    },
    university: {
        fontSize: 14,
        color: '#89B4FA',
        fontWeight: '600',
        marginBottom: 10,
    },
    editBtn: {
        flexDirection: 'row',
        backgroundColor: '#CBA6F7',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 5,
    },
    editBtnText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#11111B',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#1E1E2E',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        backgroundColor: '#CBA6F7',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 30,
    },
    actionBtnText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#11111B',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#313244',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#CDD6F4',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#A6ADC8',
    },
    menu: {
        backgroundColor: '#1E1E2E',
        borderRadius: 20,
        width: '100%',
        padding: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#313244',
    },
    menuText: {
        flex: 1,
        marginLeft: 15,
        fontSize: 16,
        color: '#CDD6F4',
        fontWeight: '500',
    },
    sectionHeader: {
        padding: 15,
        paddingBottom: 5,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
