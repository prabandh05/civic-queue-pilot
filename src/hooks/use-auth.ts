import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  citizen_id?: string;
  role: 'citizen' | 'officer' | 'admin';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        // If no profile exists, create one for existing users
        if (error.code === 'PGRST116') {
          console.log('No profile found, creating default profile');
          await createDefaultProfile(userId);
          return;
        }
        throw error;
      }
      console.log('Profile fetched successfully:', data);
      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const userData = user.user.user_metadata;
      console.log('Creating default profile with data:', userData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: userData.full_name || userData.email?.split('@')[0] || 'User',
          phone: userData.phone || '',
          citizen_id: userData.citizen_id || '',
          role: userData.role || 'citizen'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        throw error;
      }
      
      console.log('Default profile created:', data);
      setProfile(data as Profile);
    } catch (error) {
      console.error('Error creating default profile:', error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isOfficer: profile?.role === 'officer' || profile?.role === 'admin',
    isCitizen: profile?.role === 'citizen',
    isAdmin: profile?.role === 'admin',
  };
};