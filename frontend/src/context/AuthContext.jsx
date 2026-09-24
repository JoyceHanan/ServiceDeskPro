import React, { createContext, useContext, useState, useEffect } from "react";

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
            const res = await fetch("/api/auth/me", {
                headers: { "Content-Type": "application/json" }
            });
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
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Login failed");
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
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Registration failed");
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
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            setUser(null);
            showToast("Logged out successfully", "info");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, checkAuth, toast, showToast }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
