import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "../services/authService";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("eventric_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: profile } = await authService.getProfile();
        setUser(profile);
        connectSocket();
      } catch {
        localStorage.removeItem("eventric_token");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: loggedInUser } = await authService.login(credentials);
    localStorage.setItem("eventric_token", token);
    setUser(loggedInUser);
    connectSocket();
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: newUser } = await authService.register(payload);
    localStorage.setItem("eventric_token", token);
    setUser(newUser);
    connectSocket();
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("eventric_token");
    setUser(null);
    disconnectSocket();
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
