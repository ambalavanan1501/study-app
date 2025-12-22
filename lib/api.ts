import { supabase } from './supabase';
import { ParsedEntry } from './timetable-parser';

// ... imports
import { decode } from 'base64-arraybuffer';

export async function uploadProfileImage(base64File: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const fileName = `${user.id}/${Date.now()}.png`;

    const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64File), {
            contentType: 'image/png',
            upsert: true
        });

    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

    // Update profile with new avatar URL
    await updateProfile({ avatar_url: data.publicUrl });

    return data.publicUrl;
}

export async function getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export async function updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { error } = await supabase
        .from('profiles')
        .upsert({ ...updates, id: user.id, updated_at: new Date() });

    if (error) throw error;
}

export async function saveTimeTableEntry(entry: ParsedEntry) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { error } = await supabase.from('classes').insert({
        user_id: user.id,
        subject_name: entry.subject_name,
        subject_code: entry.subject_code,
        type: entry.type,
        slot_code: entry.slot_code,
        slot_label: entry.slot_label,
        room: entry.room_number,
        credit: entry.credit,
        day: entry.day,
        start_time: entry.start_time,
        end_time: entry.end_time,
    });

    if (error) throw error;
}

export async function deleteClass(id: number) {
    const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function fetchClasses(day?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

    if (day) {
        query = query.eq('day', day);
    }

    const { data, error } = await query;
    console.log('[API] fetchClasses result:', data?.length, 'rows', error ? 'Error: ' + error.message : '');
    if (data && data.length > 0) console.log('[API] First row sample:', data[0]);

    if (error) {
        console.error('Error fetching classes:', error);
        return [];
    }
    return data;
}

export async function fetchTasks(limit = 5) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
    return data;
}

export async function addTask(title: string, dueDate?: Date) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title,
        due_date: dueDate ? dueDate.toISOString() : null,
        is_completed: false,
    });

    if (error) throw error;
}

export async function toggleTaskCompletion(id: number, isCompleted: boolean) {
    const { error } = await supabase
        .from('tasks')
        .update({ is_completed: isCompleted })
        .eq('id', id);

    if (error) throw error;
}

export const deleteTask = async (id: number) => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Skills API ---

export const fetchSkills = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const addSkill = async (title: string, progress: number = 0) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('skills')
        .insert([{ user_id: user.id, title, progress }]);

    if (error) throw error;
};

export const updateSkillProgress = async (id: number, progress: number) => {
    const { error } = await supabase
        .from('skills')
        .update({ progress })
        .eq('id', id);

    if (error) throw error;
};

export const deleteSkill = async (id: number) => {
    const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
