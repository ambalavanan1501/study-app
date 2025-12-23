import { supabase } from './supabase';

export interface GradeDetails {
    id?: string;
    user_id?: string; // If we have auth
    credits_registered: number;
    credits_earned: number;
    cgpa: number;
    grade_counts: {
        s: number;
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
        n: number;
    };
}

export const fetchGradeDetails = async (): Promise<GradeDetails | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('student_grades')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.log('Error fetching grades:', error);
            return null;
        }

        return data as GradeDetails;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateGradeDetails = async (details: Partial<GradeDetails>): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Check if exists
        const { data: existing } = await supabase
            .from('student_grades')
            .select('id')
            .eq('user_id', user.id)
            .single();

        let error;
        if (existing) {
            const { error: updateError } = await supabase
                .from('student_grades')
                .update({ ...details, updated_at: new Date() })
                .eq('user_id', user.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('student_grades')
                .insert([{ ...details, user_id: user.id }]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving grades:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
