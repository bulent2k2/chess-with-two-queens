import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateStats: (result: 'win' | 'loss' | 'draw') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsLoading(true);
    try {
      // Check localStorage for saved user
      const savedUserId = localStorage.getItem('chess_user_id');
      if (savedUserId) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', savedUserId)
          .single();
        
        if (profile && !error) {
          setUser(profile);
        } else {
          localStorage.removeItem('chess_user_id');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find user by email
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error || !profile) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Simple password check (in production, use proper hashing)
      const { data: authData, error: authError } = await supabase
        .from('user_auth')
        .select('password_hash')
        .eq('user_id', profile.id)
        .single();
      
      if (authError || !authData) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Simple password comparison (in production, use bcrypt)
      if (authData.password_hash !== btoa(password)) {
        return { success: false, error: 'Invalid email or password' };
      }

      setUser(profile);
      localStorage.setItem('chess_user_id', profile.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existingEmail) {
        return { success: false, error: 'Email already registered' };
      }

      // Check if username already exists
      const { data: existingUsername } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (existingUsername) {
        return { success: false, error: 'Username already taken' };
      }

      // Generate a proper UUID
      const id = crypto.randomUUID();


      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id,
          username,
          email: email.toLowerCase(),
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          games_drawn: 0
        })
        .select()
        .single();
      
      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Store password hash
      const { error: authError } = await supabase
        .from('user_auth')
        .insert({
          user_id: id,
          password_hash: btoa(password) // Simple encoding (use bcrypt in production)
        });
      
      if (authError) {
        // Rollback profile creation
        await supabase.from('user_profiles').delete().eq('id', id);
        return { success: false, error: authError.message };
      }

      setUser(profile);
      localStorage.setItem('chess_user_id', profile.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('chess_user_id');
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Update failed' };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const updateStats = async (result: 'win' | 'loss' | 'draw') => {
    if (!user) return;

    try {
      const updates: Partial<UserProfile> = {
        games_played: user.games_played + 1,
      };

      if (result === 'win') {
        updates.games_won = user.games_won + 1;
      } else if (result === 'loss') {
        updates.games_lost = user.games_lost + 1;
      } else {
        updates.games_drawn = user.games_drawn + 1;
      }

      await updateProfile(updates);
    } catch (error) {
      console.error('Stats update error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        refreshProfile,
        updateStats
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
