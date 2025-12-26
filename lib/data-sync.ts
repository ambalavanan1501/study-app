import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';
import { fetchClasses, saveTimeTableEntry } from './api';
import { syncWeekReminders } from './notifications';
import { Alert, Platform, NativeModules } from 'react-native';

const BACKUP_FILE_NAME = 'study_app_timetable_backup.json';

export async function exportTimetable() {
    try {
        const classes = await fetchClasses();
        if (!classes || classes.length === 0) {
            Alert.alert('No Data', 'You do not have any classes to export.');
            return;
        }

        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            classes: classes.map(({ id, user_id, created_at, ...rest }: any) => rest) // Exclude internal IDs
        };

        // @ts-ignore
        const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') + BACKUP_FILE_NAME;
        // @ts-ignore
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));

        if (!(await Sharing.isAvailableAsync())) {
            Alert.alert('Sharing Not Available', 'Sharing is not available on this device.');
            return;
        }

        await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Timetable Data',
            UTI: 'public.json'
        });

    } catch (error) {
        console.error('[Export] Error:', error);
        Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    }
}

export async function importTimetable() {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true
        });

        if (result.canceled) return;

        const fileUri = result.assets[0].uri;
        // @ts-ignore
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const backupData = JSON.parse(fileContent);

        if (!backupData.classes || !Array.isArray(backupData.classes)) {
            Alert.alert('Invalid File', 'The selected file does not contain valid timetable data.');
            return;
        }

        Alert.alert(
            'Import Data',
            `This will add ${backupData.classes.length} classes to your timetable. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Import',
                    onPress: async () => {
                        await performImport(backupData.classes);
                    }
                }
            ]
        );

    } catch (error) {
        console.error('[Import] Error:', error);
        Alert.alert('Import Failed', 'An error occurred while importing your data.');
    }
}

async function performImport(classes: any[]) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not logged in');

        // Note: For simplicity, we append data. 
        // A more advanced version might ask to "Clear and Replace" or "Merge".
        for (const item of classes) {
            // Re-use saveTimeTableEntry but we need to map the fields correctly 
            // since saveTimeTableEntry expects ParsedEntry from the parser.
            // Let's manually insert for precision.
            const { error } = await supabase.from('classes').insert({
                ...item,
                user_id: user.id
            });
            if (error) console.error('Error inserting class:', item.subject_name, error);
        }

        // Trigger updates
        const updatedClasses = await fetchClasses();
        await syncWeekReminders(updatedClasses);
        updateWidget(updatedClasses);

        Alert.alert('Success', 'Your timetable has been imported successfully.');

    } catch (error) {
        console.error('[Import] performImport error:', error);
        Alert.alert('Import Failed', 'Partial import may have occurred.');
    }
}

export function updateWidget(classes: any[]) {
    if (Platform.OS !== 'android') return;

    try {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let fullWeekData = "";

        for (const day of days) {
            const dayClasses = classes.filter(c => c.day && c.day.toLowerCase() === day.toLowerCase());
            if (dayClasses.length > 0) {
                fullWeekData += `\n${day.slice(0, 3)}:\n`;
                fullWeekData += dayClasses
                    .map((c: any) => `• ${c.subject_name} (${c.start_time.slice(0, 5)})`)
                    .join('\n');
                fullWeekData += "\n";
            }
        }

        const { TimetableWidgetModule } = NativeModules;
        if (TimetableWidgetModule) {
            TimetableWidgetModule.setTimetableData(fullWeekData.trim() || "No classes set for this week");
        } else {
            console.warn('[Widget] TimetableWidgetModule not found');
        }
    } catch (e) {
        console.error("[Widget] Update failed", e);
    }
}
