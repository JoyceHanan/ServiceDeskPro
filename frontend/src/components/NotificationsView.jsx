import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, CheckCircle2 } from "lucide-react";

export default function NotificationsView() {
    const { showToast } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/read-all", { method: "PATCH" });
            showToast("All notifications marked as read", "success");
            fetchNotifications();
        } catch (err) {
            showToast("Failed to update notifications", "error");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>In-App Notifications</h3>
                <button onClick={markAllRead} className="btn btn-secondary btn-sm">
                    <CheckCircle2 size={16} /> Mark All as Read
                </button>
            </div>

            <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {loading ? (
                    <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No notifications found.</div>
                ) : (
                    notifications.map(n => (
                        <div key={n._id} style={{
                            padding: "16px",
                            borderRadius: "10px",
                            background: n.read ? "rgba(15, 23, 42, 0.4)" : "rgba(59, 130, 246, 0.12)",
                            border: n.read ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(59, 130, 246, 0.3)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div>
                                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#f8fafc" }}>{n.title}</div>
                                <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>{n.message}</div>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                {new Date(n.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
