import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { fetchProfile } from "../services/userService";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      const { data } = await supabase.auth.getSession();
      await updateUser(data.session);
    }

    initializeAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await updateUser(session);
    });

    return () => subscription?.subscription?.unsubscribe?.();
  }, []);

  async function updateUser(session) {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const profile = await fetchProfile(session.user.id);
    setUser({
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.user_metadata?.full_name || "User",
      role: profile?.role || session.user.user_metadata?.role || "user",
    });
    setLoading(false);
  }

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    await updateUser(data.session);
    return { user: data.user };
  }

  async function register({ email, password, name, role = "user" }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
        },
      },
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name,
        role,
      });
    }

    return { user: data.user };
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
