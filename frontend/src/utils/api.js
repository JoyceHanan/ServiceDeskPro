// Centralized API fetch wrapper ensuring credentials (cookies) and token headers are attached

const API_BASE = import.meta.env.VITE_API_URL || "";

export const getStoredToken = () => {
    try {
        return localStorage.getItem("token") || "";
    } catch {
        return "";
    }
};

export const setStoredToken = (token) => {
    try {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    } catch (e) {
        console.warn("Unable to access localStorage:", e);
    }
};

export const apiFetch = async (endpoint, options = {}) => {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    const headers = {
        ...(options.headers || {})
    };

    if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const token = getStoredToken();
    if (token && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        credentials: "include",
        headers
    };

    return fetch(url, config);
};
