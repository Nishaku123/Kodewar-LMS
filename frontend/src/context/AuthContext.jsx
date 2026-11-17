import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
} from "../services/auth.js";

const AuthContext = createContext(null);

/**
 * Stores the signed-in user for the whole app.
 *
 * The JWT itself lives in an httpOnly cookie, so this provider only keeps
 * the public user object returned by the API. Calling refresh() asks the
 * server who is signed in, which also works after a page reload.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const payload = await getCurrentUserRequest();
      setUser(payload.data.user);
      return payload.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const payload = await getCurrentUserRequest();

        if (active) setUser(payload.data.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const payload = await loginRequest(credentials);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const payload = await registerRequest(details);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Even if the network request failed, the local session is cleared.
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (details) => {
    const payload = await updateProfileRequest(details);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refresh,
      updateProfile,
    }),
    [user, loading, login, register, logout, refresh, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
