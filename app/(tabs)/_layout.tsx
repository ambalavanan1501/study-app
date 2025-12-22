import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/TabBar';

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
            <Tabs.Screen name="timetable" options={{ title: 'Timetable' }} />
            <Tabs.Screen name="skills" options={{ title: 'Skills' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
    );
}
