import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Plus, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Header({ activeTab, onOpenCreateTicket, setActiveTab }) {
    const { user, showToast } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {}
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 20000); // Polling every 20s
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/read-all", { method: "PATCH" });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            showToast("Notifications marked as read", "info");
        } catch (err) {}
    };

    const triggerSLABreachCheck = async () => {
        try {
            const res = await fetch("/api/sla/evaluate-breaches", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                showToast(data.message, "success");
                fetchNotifications();
            }
        } catch (err) {
            showToast("Failed to evaluate SLA breaches", "error");
        }
    };

    return (
        <header style={{
            height: "70px",
            padding: "0 28px",
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 90
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", textTransform: "capitalize" }}>
                    {activeTab.replace("-", " ")}
                </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {["System Admin", "IT Manager", "Technician"].includes(user?.role) && (
                    <button
                        onClick={triggerSLABreachCheck}
                        className="btn btn-secondary btn-sm"
                        title="Run SLA breach check engine"
                    >
                        <RefreshCw size={15} />
                        Evaluate SLA
                    </button>
                )}

                <button
                    onClick={onOpenCreateTicket}
                    className="btn btn-primary btn-sm"
                >
                    <Plus size={16} />
                    Create Ticket
                </button>

                {/* Notifications Bell */}
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                        style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            color: "#f8fafc",
                            cursor: "pointer",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span style={{
                                background: "#ef4444",
                                color: "#ffffff",
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                padding: "2px 6px",
                                borderRadius: "9999px"
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifDropdown && (
                        <div className="glass-card" style={{
                            position: "absolute",
                            right: 0,
                            top: "48px",
                            width: "340px",
                            padding: "16px",
                            zIndex: 110,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h4 style={{ fontSize: "0.9rem", fontWeight: "700" }}>Notifications</h4>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                                {notifications.length === 0 ? (
                                    <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", padding: "16px" }}>
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.slice(0, 6).map(n => (
                                        <div
                                            key={n._id}
                                            onClick={() => {
                                                setShowNotifDropdown(false);
                                                setActiveTab("notifications");
                                            }}
                                            style={{
                                                padding: "10px",
                                                borderRadius: "8px",
                                                background: n.read ? "transparent" : "rgba(59, 130, 246, 0.1)",
                                                border: n.read ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(59, 130, 246, 0.2)",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f8fafc" }}>{n.title}</div>
                                            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>{n.message}</div>
                                            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
