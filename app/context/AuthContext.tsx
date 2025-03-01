"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userId: number | null;
  login: (token: string, userId: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  userId: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const storedToken = localStorage.getItem("canvas_token");
    const storedUserId = localStorage.getItem("canvas_user_id");

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(parseInt(storedUserId, 10));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (newToken: string, newUserId: number) => {
    localStorage.setItem("canvas_token", newToken);
    localStorage.setItem("canvas_user_id", newUserId.toString());
    setToken(newToken);
    setUserId(newUserId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("canvas_token");
    localStorage.removeItem("canvas_user_id");
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, userId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
