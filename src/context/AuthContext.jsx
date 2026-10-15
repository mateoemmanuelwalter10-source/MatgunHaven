import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { fetchProfile } from "../services/userService";
import { fetchBusinessSettings } from "../services/businessSettingsService";
import {
  logFailedLogin,
  logSystemError,
  logSystemEvent,
} from "../services/systemLogService";

const AuthContext = createContext({});
const defaultBusinessSettings = {
  business_name: "Matgun Haven",
  business_tagline: "Purified Drinking Station",
  logo_path: null,
  logo_url: "",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(defaultBusinessSettings);
  const [loading, setLoading] = useState(true);
  const [showDeactivatedCustomers, setShowDeactivatedCustomers] = useState(false);

  const updateUser = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setBusinessSettings(defaultBusinessSettings);
      setShowDeactivatedCustomers(false);
      setLoading(false);
      return;
    }

    const [profileResult, settingsResult] = await Promise.all([
      fetchProfile(session.user.id),
      fetchBusinessSettings(),
    ]);
    const { data: profile, error: profileError } = profileResult;
    if (!settingsResult.error && settingsResult.data) {
      setBusinessSettings(settingsResult.data);
    }
    const role = profile?.role || session.user.user_metadata?.role || "user";
    setUser({
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.user_metadata?.full_name || "User",
      role: String(role).trim().toLowerCase(),
    });
    setLoading(false);
    return { error: profileError };
  }, []);

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
  }, [updateUser]);

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logFailedLogin();
      return { error };
    }

    setShowDeactivatedCustomers(false);
    await updateUser(data.session);
    await logSystemEvent({
      eventType: "login",
      message: "User signed in",
      entityType: "user",
      entityId: data.user?.id,
    });
    return { user: data.user };
  }

  async function logout() {
    const { data } = await supabase.auth.getSession();
    const actorId = data.session?.user?.id;
    await logSystemEvent({
      eventType: "logout",
      message: "User signed out",
      entityType: "user",
      entityId: actorId,
    });
    const { error } = await supabase.auth.signOut();
    if (error) {
      await logSystemError("logout", error, { entityType: "user", entityId: actorId });
      return { error };
    }
    setUser(null);
    setShowDeactivatedCustomers(false);
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        businessSettings,
        setBusinessSettings,
        loading,
        login,
        logout,
        showDeactivatedCustomers,
        setShowDeactivatedCustomers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
