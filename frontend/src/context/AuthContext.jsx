import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch, setStoredToken } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "info") => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    const checkAuth = async () => {
        try {
            const res = await apiFetch("/api/auth/me");
            if (!res.ok) {
                setUser(null);
                return;
            }
            const data = await res.json();
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Login failed");
            }
            if (data.token) {
                setStoredToken(data.token);
            }
            setUser(data.user);
            showToast(`Welcome back, ${data.user.name}!`, "success");
            return data.user;
        } catch (err) {
            showToast(err.message, "error");
            throw err;
        }
    };

    const register = async (userData) => {
        try {
            const res = await apiFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Registration failed");
            }
            if (data.token) {
                setStoredToken(data.token);
            }
            setUser(data.user);
            showToast("Account registered successfully!", "success");
            return data.user;
        } catch (err) {
            showToast(err.message, "error");
            throw err;
        }
    };

    const logout = async () => {
        try {
            await apiFetch("/api/auth/logout", {
                method: "POST"
            });
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setStoredToken(null);
            setUser(null);
            showToast("Logged out successfully", "info");
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, checkAuth, toast, showToast }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
