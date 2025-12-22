import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { useRouter } from 'expo-router';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors, theme } = useTheme();
    const router = useRouter();

    // Mapping routes to icons and labels
    // We expect: index, timetable, skills, profile
    // We want to insert a dummy "Add" in the middle

    // The visual order we want:
    // 1. Dashboard (Home)
    // 2. Timetable (Attendance/Calendar)
    // 3. [CENTER ACTION]
    // 4. Skills (Spotlight)
    // 5. Profile (More)

    const primaryColor = colors.primary;
    const inactiveColor = colors.subtext;

    return (
        <View style={styles.container}>
            <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                {/* Left Side */}
                {renderTab(0, 'dashboard', 'home', 'Home', state, navigation, primaryColor, inactiveColor)}
                {renderTab(1, 'timetable', 'calendar', 'Timetable', state, navigation, primaryColor, inactiveColor)}

                {/* Spacer for Center Button */}
                <View style={styles.spacer} />

                {/* Right Side */}
                {renderTab(2, 'skills', 'star', 'Skills', state, navigation, primaryColor, inactiveColor)}
                {renderTab(3, 'profile', 'grid', 'More', state, navigation, primaryColor, inactiveColor)}
            </View>

            {/* Floating Center Button */}
            <TouchableOpacity
                style={[styles.centerButton, { backgroundColor: colors.background, borderColor: colors.surface }]}
                onPress={() => router.push('/add-course')} // Default action: Add Course
                activeOpacity={0.8}
            >
                <View style={[styles.centerButtonInner, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="add" size={32} color="#FFFFFF" />
                </View>
            </TouchableOpacity>
        </View>
    );
}

function renderTab(
    index: number,
    routeName: string,
    iconName: any,
    label: string,
    state: any,
    navigation: any,
    activeColor: string,
    inactiveColor: string
) {
    const isFocused = state.routes[index].name === routeName && state.index === index;
    // Note: state.routes order might differ from our visual order if we rearranged files.
    // However, usually they follow alphabetical or folder order.
    // Better way: find the route by name.

    const route = state.routes.find((r: any) => r.name === routeName);
    if (!route) return null; // Should not happen if configured correctly

    const onPress = () => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
        }
    };

    return (
        <TouchableOpacity
            key={routeName}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
        >
            <Feather
                name={iconName}
                size={24}
                color={isFocused ? activeColor : inactiveColor}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? activeColor : inactiveColor }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bar: {
        flexDirection: 'row',
        height: 70, // Slightly taller for modern look
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 0.5, // Subtle border
        // paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Handle Safe Area internally or let simple padding work
        paddingBottom: 5,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
            },
            android: {
                elevation: 20,
                shadowColor: '#000', // elevation shadow color
            }
        })
    },
    spacer: {
        width: 60, // Space for the center button
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '500',
    },
    centerButton: {
        position: 'absolute',
        top: -25, // Float up half-way
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        // Creating the "cutout" effect using the border
        borderWidth: 5, // Thick border to match background color simulates "cutout"
        ...Platform.select({
            ios: {
                shadowColor: '#89B4FA', // Primary color glow
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            }
        })
    },
    centerButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
