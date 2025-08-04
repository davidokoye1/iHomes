// src/utils/profileHandler.ts
import { supabase } from '../lib/supabaseClient';

export interface ProfileData {
  full_name: string;
  role: 'user' | 'agent';
  agency_name?: string;
  license_number?: string;
  phone?: string;
  whatsapp_number?: string;
  bio?: string;
  website?: string;
}

export async function ensureProfileExists(userId: string, email: string, profileData?: ProfileData) {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('Profile already exists');
      return { success: true, profile: existingProfile };
    }

    // Create profile if it doesn't exist
    const newProfile = {
      id: userId,
      email: email,
      full_name: profileData?.full_name || '',
      role: profileData?.role || 'user',
      agency_name: profileData?.agency_name || null,
      license_number: profileData?.license_number || null,
      phone: profileData?.phone || null,
      whatsapp_number: profileData?.whatsapp_number || null,
      bio: profileData?.bio || null,
      website: profileData?.website || null,
      email_confirmed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return { success: false, error };
    }

    console.log('Profile created successfully:', data);
    return { success: true, profile: data };

  } catch (error) {
    console.error('Error in ensureProfileExists:', error);
    return { success: false, error };
  }
}

export async function updateEmailConfirmationStatus(userId: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        email_confirmed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating email confirmation status:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateEmailConfirmationStatus:', error);
    return { success: false, error };
  }
}