import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { statusColors, priorityColors } from "../style/common";
import { 
    Ticket, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    HardDrive, 
    Users, 
    Building2, 
    ShieldAlert, 
    Sparkles, 
    ArrowUpRight,
    Activity
} from "lucide-react";

export default function DashboardView({ setActiveTab, onSelectTicket, onOpenCreateTicket }) {
    const { user } = useAuth();
    const role = user?.role || "Employee";

    const [stats, setStats] = useState({
        tickets: [],
        assets: [],
        usersCount: 0,
        departmentsCount: 0,
        recentAudits: [],
        kbArticles: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [ticketsRes, assetsRes] = await Promise.all([
                    fetch("/api/tickets").then(r => r.json()),
                    fetch("/api/assets").then(r => r.json())
                ]);

                let usersCount = 0;
                let departmentsCount = 0;
                let recentAudits = [];
                let kbArticles = [];

                if (["System Admin", "IT Manager"].includes(role)) {
                    const [uRes, dRes, aRes] = await Promise.all([
                        fetch("/api/users").then(r => r.json()),
                        fetch("/api/departments").then(r => r.json()),
                        fetch("/api/audit?limit=5").then(r => r.json())
                    ]);
                    usersCount = uRes.count || 0;
                    departmentsCount = dRes.count || 0;
                    recentAudits = aRes.logs || [];
                }

                setStats({
                    tickets: ticketsRes.tickets || [],
                    assets: assetsRes.assets || [],
                    usersCount,
                    departmentsCount,
                    recentAudits,
                    kbArticles
                });
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [role]);

    // Computed Metrics
    const totalTickets = stats.tickets.length;
    const openTickets = stats.tickets.filter(t => t.status === "Open").length;
    const assignedTickets = stats.tickets.filter(t => t.status === "Assigned").length;
    const inProgressTickets = stats.tickets.filter(t => t.status === "In Progress").length;
    const pendingTickets = stats.tickets.filter(t => t.status === "Pending").length;
    const resolvedTickets = stats.tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;
    const slaBreachedTickets = stats.tickets.filter(t => t.slaBreached || (t.resolutionDueAt && new Date(t.resolutionDueAt) < new Date() && !["Resolved", "Closed"].includes(t.status)));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Banner */}
            <div className="glass-card" style={{
                padding: "24px 30px",
                background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(59, 130, 246, 0.15) 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: "800" }}>
                        Welcome back, {user?.name}! 👋
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "4px" }}>
                        Role: <span style={{ color: "#60a5fa", fontWeight: "700" }}>{role}</span> • Department: {user?.department?.name || "General"}
                    </p>
                </div>
                <button onClick={onOpenCreateTicket} className="btn btn-primary">
                    <Sparkles size={18} />
                    Report IT Issue
                </button>
            </div>

            {/* Metric Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px"
            }}>
                <div className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#3b82f6" }}>
                        <Ticket size={24} />
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>TOTAL</span>
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "12px" }}>{totalTickets}</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
                        {role === "Employee" ? "My Submitted Tickets" : "Active Service Requests"}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
                        <Clock size={24} />
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>OPEN / IN PROGRESS</span>
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "12px" }}>
                        {openTickets + assignedTickets + inProgressTickets}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>Requiring Attention</div>
                </div>

                <div className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
                        <CheckCircle2 size={24} />
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>RESOLVED</span>
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "12px" }}>{resolvedTickets}</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>Successfully Closed</div>
                </div>

                <div className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
                        <AlertTriangle size={24} />
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>SLA BREACHES</span>
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "12px", color: slaBreachedTickets.length > 0 ? "#ef4444" : "#10b981" }}>
                        {slaBreachedTickets.length}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>Overdue Resolution Deadlines</div>
                </div>
            </div>

            {/* Main Dashboard Layout: Recent Tickets + Role-Specific Widgets */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
                {/* Recent Tickets Table */}
                <div className="glass-card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Recent Tickets</h3>
                        <button
                            onClick={() => setActiveTab("tickets")}
                            style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                            View All <ArrowUpRight size={16} />
                        </button>
                    </div>

                    <div className="sd-table-container">
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Requester</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                                            No tickets found
                                        </td>
                                    </tr>
                                ) : (
                                    stats.tickets.slice(0, 5).map(t => {
                                        const statusStyle = statusColors[t.status] || statusColors["Open"];
                                        const priorityStyle = priorityColors[t.priority] || priorityColors["Medium"];
                                        return (
                                            <tr key={t._id}>
                                                <td style={{ fontWeight: "600" }}>{t.title}</td>
                                                <td>
                                                    <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ background: priorityStyle.bg, color: priorityStyle.text }}>
                                                        {t.priority}
                                                    </span>
                                                </td>
                                                <td>{t.requester?.name || "System"}</td>
                                                <td>
                                                    <button
                                                        onClick={() => onSelectTicket(t)}
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Role Specific Side Widgets */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Assigned Hardware Assets Widget */}
                    <div className="glass-card" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                                <HardDrive size={18} color="#8b5cf6" />
                                Assigned Assets ({stats.assets.length})
                            </h4>
                            <button
                                onClick={() => setActiveTab("assets")}
                                style={{ background: "none", border: "none", color: "#8b5cf6", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}
                            >
                                Manage
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {stats.assets.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No hardware assets assigned.</div>
                            ) : (
                                stats.assets.slice(0, 3).map(asset => (
                                    <div key={asset._id} style={{
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        background: "rgba(15, 23, 42, 0.6)",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>{asset.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{asset.assetTag} • {asset.category}</div>
                                        </div>
                                        <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                                            {asset.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* System Activity / Audit Feed for Admins/Managers */}
                    {["System Admin", "IT Manager"].includes(role) && (
                        <div className="glass-card" style={{ padding: "20px" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Activity size={18} color="#06b6d4" />
                                Live System Audit Feed
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {stats.recentAudits.length === 0 ? (
                                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No recent audit activity.</div>
                                ) : (
                                    stats.recentAudits.map(log => (
                                        <div key={log._id} style={{ fontSize: "0.8rem", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "8px" }}>
                                            <span style={{ fontWeight: "700", color: "#3b82f6" }}>{log.user?.name || "System"}</span>: {log.action} on {log.entity}
                                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
