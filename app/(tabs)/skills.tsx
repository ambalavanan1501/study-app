import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { fetchSkills, addSkill, updateSkillProgress, deleteSkill } from '../../lib/api';
import { useFocusEffect } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../lib/theme';

export default function SkillsScreen() {
    const { colors, theme } = useTheme();
    const [skills, setSkills] = useState<any[]>([]);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);

    // Form States
    const [newSkillTitle, setNewSkillTitle] = useState('');
    const [selectedSkill, setSelectedSkill] = useState<any>(null);
    const [progressValue, setProgressValue] = useState(0);

    const loadSkills = useCallback(async () => {
        try {
            const data = await fetchSkills();
            setSkills(data || []);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSkills();
        }, [loadSkills])
    );

    const handleAddSkill = async () => {
        if (!newSkillTitle.trim()) {
            Alert.alert("Error", "Please enter a skill title");
            return;
        }
        try {
            await addSkill(newSkillTitle, 0);
            setNewSkillTitle('');
            setAddModalVisible(false);
            loadSkills();
        } catch (error) {
            Alert.alert("Error", "Failed to add skill");
        }
    };

    const openUpdateModal = (skill: any) => {
        setSelectedSkill(skill);
        setProgressValue(skill.progress);
        setUpdateModalVisible(true);
    };

    const handleUpdateProgress = async () => {
        if (!selectedSkill) return;
        try {
            await updateSkillProgress(selectedSkill.id, progressValue);
            setUpdateModalVisible(false);
            setSelectedSkill(null);
            loadSkills();
        } catch (error) {
            Alert.alert("Error", "Failed to update progress");
        }
    };

    const handleDeleteSkill = (id: number) => {
        Alert.alert(
            "Delete Skill",
            "Are you sure you want to stop tracking this skill?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteSkill(id);
                            loadSkills();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete skill");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Skills Tracker</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                    <MaterialIcons name="add-circle" size={40} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={skills}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.skillCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => openUpdateModal(item)}
                        onLongPress={() => handleDeleteSkill(item.id)}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.skillTitle, { color: colors.text }]}>{item.title}</Text>
                            <Text style={[styles.skillPercent, { color: item.progress === 100 ? colors.success : colors.primary }]}>{item.progress}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceHighlight }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${item.progress}%`, backgroundColor: item.progress === 100 ? colors.success : colors.primary }
                                ]}
                            />
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="clipboard-list" size={50} color={colors.subtext} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>No skills tracked yet.</Text>
                        <Text style={[styles.emptySubText, { color: colors.subtext }]}>Tap + to start learning something new!</Text>
                    </View>
                }
            />

            {/* Add Skill Modal */}
            <Modal
                visible={isAddModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Skill</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceHighlight, color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g. Web Development"
                            placeholderTextColor={colors.subtext}
                            value={newSkillTitle}
                            onChangeText={setNewSkillTitle}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.subtext }]} onPress={() => setAddModalVisible(false)}>
                                <Text style={[styles.cancelBtnText, { color: colors.subtext }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddSkill}>
                                <Text style={[styles.saveBtnText, { color: colors.background }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Update Progress Modal */}
            <Modal
                visible={isUpdateModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setUpdateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Update Progress</Text>
                        <Text style={[styles.modalSubTitle, { color: colors.subtext }]}>{selectedSkill?.title}</Text>

                        <View style={styles.sliderContainer}>
                            <Text style={[styles.sliderValue, { color: colors.primary }]}>{progressValue}%</Text>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={100}
                                step={5}
                                value={progressValue}
                                onValueChange={setProgressValue}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.surfaceHighlight}
                                thumbTintColor={colors.text}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.subtext }]} onPress={() => setUpdateModalVisible(false)}>
                                <Text style={[styles.cancelBtnText, { color: colors.subtext }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleUpdateProgress}>
                                <Text style={[styles.saveBtnText, { color: colors.background }]}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for Custom Tab Bar
    },
    skillCard: {
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    skillTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    skillPercent: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
    },
    emptySubText: {
        fontSize: 14,
        marginTop: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 5,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalSubTitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
    },
    sliderContainer: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    sliderValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        padding: 15,
        marginRight: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelBtnText: {
        fontWeight: 'bold',
    },
    saveBtn: {
        flex: 1,
        padding: 15,
        marginLeft: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveBtnText: {
        fontWeight: 'bold',
    },
});
