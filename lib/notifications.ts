import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    // SDK 53+ Warning: Expo Go no longer supports push notifications on Android.
    // We check appOwnership to avoid crashing on start in Expo Go.
    if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
        console.log('Skipping push token registration in Expo Go (Android). Use standalone APK for full notification support.');
        return;
    }

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

        // For local notifications we don't strictly needs the token in Standalone apps
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

/**
 * Automatically calculates and schedules reminders for the next 7 days of classes.
 */
export async function syncWeekReminders(classes: any[]) {
    if (!classes || classes.length === 0) return;

    // Cancel all to start fresh
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const classItem of classes) {
        if (!classItem || !classItem.subject_name || !classItem.start_time) {
            console.log('[Notifications] Skipping incomplete class item:', classItem?.id);
            continue;
        }

        try {
            const classDayIndex = DAYS.findIndex(d => d.toLowerCase() === classItem.day?.toLowerCase());
            if (classDayIndex === -1) {
                console.warn('[Notifications] Skipping class with unknown day:', classItem.day);
                continue;
            }

            const [hours, minutes] = classItem.start_time.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) {
                console.warn('[Notifications] Invalid start_time format:', classItem.start_time);
                continue;
            }

            // Find the next occurrence of this day
            let classDate = new Date();
            let currentDayIndex = classDate.getDay();

            let daysUntil = (classDayIndex - currentDayIndex + 7) % 7;
            classDate.setDate(classDate.getDate() + daysUntil);
            classDate.setHours(hours, minutes, 0, 0);

            // If it's today but already passed, move to next week
            if (daysUntil === 0 && classDate < now) {
                classDate.setDate(classDate.getDate() + 7);
            }

            // Calculate trigger time: 10 minutes before start
            const reminderDate = new Date(classDate.getTime() - 10 * 60000);

            // Only schedule if the reminder time is in the future
            if (reminderDate > now) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `Class Starting Soon: ${classItem.subject_name}`,
                        body: `Your class starts in 10 minutes in room ${classItem.room}.`,
                        sound: 'default',
                        data: { classId: classItem.id }
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: reminderDate,
                    },
                });
                console.log(`Scheduled reminder for ${classItem.subject_name} on ${classDate.toDateString()} at ${reminderDate.toLocaleTimeString()}`);
            }
        } catch (err) {
            console.error('[Notifications] Error scheduling reminder for class:', {
                subject: classItem.subject_name,
                day: classItem.day,
                start: classItem.start_time,
                error: err
            });
        }
    }
}

export async function syncClassReminders(classes: any[]) {
    // Current implementation only handles "today's" classes passed in
    // For better experience, we should use syncWeekReminders
    await syncWeekReminders(classes);
}

// Function to schedule a notification for a specific date
export async function scheduleNotificationAtTime(title: string, body: string, date: Date) {
    const now = new Date();
    const trigger = date.getTime() - now.getTime();
    if (trigger > 0) {
        // Schedule if in future
        await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: { date: date } as Notifications.DateTriggerInput,
        });
    }
}

export async function sendTestNotification(course: string, location: string, timing: string) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Test Class Reminder",
            body: `Ongoing: ${course}\nLocation: ${location}\nTiming: ${timing}`,
            sound: 'default',
        },
        trigger: null, // Send immediately
    });
}
