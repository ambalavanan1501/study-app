import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { useTheme } from '../lib/theme';
import { useRouter } from 'expo-router';

interface AddMenuProps {
    visible: boolean;
    onClose: () => void;
}

export default function AddMenu({ visible, onClose }: AddMenuProps) {
    const { colors, theme } = useTheme();
    const router = useRouter();

    const handleNavigation = (route: string) => {
        onClose();
        router.push(route as any);
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.menuContainer}>
                            <GlassCard
                                style={styles.menuCard}
                                intensity={40}
                                tint={theme === 'dark' ? 'dark' : 'light'}
                            >
                                <Text style={[styles.menuTitle, { color: colors.subtext }]}>Quick Actions</Text>

                                <TouchableOpacity
                                    style={[styles.menuItem, { borderBottomColor: colors.border }]}
                                    onPress={() => handleNavigation('/add-course')}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                                        <MaterialIcons name="add-box" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <Text style={[styles.menuItemText, { color: colors.text }]}>Add Course</Text>
                                        <Text style={[styles.menuItemSubtext, { color: colors.subtext }]}>Update your schedule</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleNavigation('/cgpa-details')}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#FFD700' + '20' }]}>
                                        <Ionicons name="school" size={24} color="#FFD700" />
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <Text style={[styles.menuItemText, { color: colors.text }]}>CGPA Details</Text>
                                        <Text style={[styles.menuItemSubtext, { color: colors.subtext }]}>View grades & credits</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={colors.subtext} />
                                </TouchableOpacity>
                            </GlassCard>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        paddingBottom: 100, // Above the tab bar
        alignItems: 'center',
    },
    menuContainer: {
        width: '90%',
        maxWidth: 350,
    },
    menuCard: {
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    menuTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 15,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuItemSubtext: {
        fontSize: 12,
        marginTop: 2,
    }
});
