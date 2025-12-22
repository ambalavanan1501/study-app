import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchClasses, deleteClass } from '../../lib/api';

export default function ManageCoursesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);

    const loadClasses = useCallback(async () => {
        // Fetch all classes (no day filter)
        const data = await fetchClasses();
        setClasses(data || []);
        setLoading(false);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadClasses();
        setRefreshing(false);
    }, [loadClasses]);

    useEffect(() => {
        loadClasses();
    }, []);

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Course',
            'Are you sure you want to remove this course entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteClass(id);
                            loadClasses(); // Refresh list
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.courseItem}>
            <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{item.subject_name}</Text>
                <Text style={styles.courseDetails}>
                    {item.day} • {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                </Text>
                <Text style={styles.courseMeta}>
                    {item.subject_code} • {item.slot_label} • {item.room}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
            >
                <MaterialIcons name="delete-outline" size={24} color="#F38BA8" />
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <Stack.Screen options={{
                title: 'Manage Courses',
                headerStyle: { backgroundColor: '#11111B' },
                headerTintColor: '#CDD6F4',
            }} />
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="#89B4FA" style={{ marginTop: 20 }} />
                ) : classes.length > 0 ? (
                    <FlatList
                        data={classes}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CDD6F4" />}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No courses added yet.</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push('/add-course')}
                        >
                            <Text style={styles.addBtnText}>Add Course</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#11111B',
    },
    listContent: {
        padding: 20,
    },
    courseItem: {
        backgroundColor: '#1E1E2E',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    courseInfo: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#CDD6F4',
        marginBottom: 4,
    },
    courseDetails: {
        fontSize: 14,
        color: '#89B4FA',
        marginBottom: 2,
        fontWeight: '500',
    },
    courseMeta: {
        fontSize: 12,
        color: '#A6ADC8',
    },
    deleteBtn: {
        padding: 10,
        backgroundColor: 'rgba(243, 139, 168, 0.1)',
        borderRadius: 10,
        marginLeft: 10,
    },
    emptyState: {
        flex: 1,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#A6ADC8',
        fontSize: 16,
        marginBottom: 20,
    },
    addBtn: {
        backgroundColor: '#89B4FA',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    addBtnText: {
        color: '#11111B',
        fontWeight: 'bold',
    },
});
