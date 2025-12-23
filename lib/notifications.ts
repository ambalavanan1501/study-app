import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // For local notifications we don't strictly needs the token
        // Expo Go SDK 53+ removed remote push notifications, so we skip getExpoPushTokenAsync
        // to avoid errors in development.
        console.log('Local notifications permissions granted.');
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export async function scheduleClassReminder(title: string, body: string, triggerSeconds: number) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: 'default',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: triggerSeconds,
            repeats: false,
        },
    });
}

// Function to schedule a notification for a specific date
export async function scheduleNotificationAtTime(title: string, body: string, date: Date) {
    const now = new Date();
    const trigger = date.getTime() - now.getTime();
    if (trigger > 0) {
        // Schedule if in future
        await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: date, // Pass Date object directly
        });
    }
}
