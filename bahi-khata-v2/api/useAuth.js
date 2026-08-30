import { useState, useEffect } from 'react';
import { authService, supabase } from '../services/supabase';
import { usePortfolioStore } from '../store/portfolioStore';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setCurrentUser = usePortfolioStore(state => state.setCurrentUser);

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setCurrentUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, [setCurrentUser]);

  const checkUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUser(user);
      setCurrentUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.signup(email, password);

      // When email confirmation is switched on, Supabase returns a user but no
      // session. Treating that as "logged in" showed the app while the database
      // still saw an anonymous request, so every save failed with a row-level
      // security error. Only sign the user in once a real session exists.
      if (!data.session) {
        throw new Error('Please check your email and confirm your address, then log in.');
      }

      setUser(data.user);
      setCurrentUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signin = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.signin(email, password);
      setUser(data.user);
      setCurrentUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signout();
      setUser(null);
      setCurrentUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signup,
    signin,
    logout,
    isAuthenticated: !!user
  };
};
