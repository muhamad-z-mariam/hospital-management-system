import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../api/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if tokens and user are stored in localStorage
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (storedUser && accessToken && refreshToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.error || "Invalid credentials"
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem("access_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
