import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
    LayoutDashboard, 
    Ticket, 
    HardDrive, 
    BookOpen, 
    Users, 
    Building2, 
    Clock, 
    Bell, 
    ShieldAlert, 
    Store, 
    User, 
    LogOut, 
    Layers,
    SlidersHorizontal,
    Globe
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {
    const { user, logout } = useAuth();
    const role = user?.role || "Employee";

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["System Admin", "IT Manager", "Technician", "Employee", "Asset Manager"] },
        { id: "tickets", label: "Tickets", icon: Ticket, roles: ["System Admin", "IT Manager", "Technician", "Employee", "Asset Manager"] },
        { id: "assets", label: "Assets", icon: HardDrive, roles: ["System Admin", "IT Manager", "Technician", "Employee", "Asset Manager"] },
        { id: "knowledge", label: "Knowledge Base", icon: BookOpen, roles: ["System Admin", "IT Manager", "Technician", "Employee", "Asset Manager"] },
        { id: "users", label: "User Directory", icon: Users, roles: ["System Admin", "IT Manager"] },
        { id: "departments", label: "Departments", icon: Building2, roles: ["System Admin", "IT Manager"] },
        { id: "categories", label: "Categories", icon: Layers, roles: ["System Admin", "IT Manager"] },
        { id: "sla", label: "SLA Policies", icon: Clock, roles: ["System Admin", "IT Manager"] },
        { id: "vendors", label: "Vendors", icon: Store, roles: ["System Admin", "IT Manager", "Asset Manager"] },
        { id: "notifications", label: "Notifications", icon: Bell, roles: ["System Admin", "IT Manager", "Technician", "Employee", "Asset Manager"] },
        { id: "audit", label: "Audit Logs", icon: ShieldAlert, roles: ["System Admin", "IT Manager"] },
        { id: "organizations", label: "Organizations", icon: Globe, roles: ["System Admin"] },
        { id: "profile", label: "My Profile", icon: User, roles: ["System Admin", "IT Manager", "Technician", "Employee", "Asset Manager"] }
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(role));

    return (
        <aside style={{
            width: "260px",
            minWidth: "260px",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            position: "sticky",
            top: 0,
            zIndex: 100
        }}>
            {/* Brand Header */}
            <div style={{
                padding: "24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "12px"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
                }}>
                    <Ticket size={22} color="#ffffff" />
                </div>
                <div>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#f8fafc" }}>ServiceDesk Pro</h2>
                    <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(59, 130, 246, 0.2)",
                        color: "#60a5fa",
                        textTransform: "uppercase"
                    }}>
                        {role}
                    </span>
                </div>
            </div>

            {/* Navigation List */}
            <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                {filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "none",
                                width: "100%",
                                textAlign: "left",
                                fontSize: "0.9rem",
                                fontWeight: isActive ? "700" : "500",
                                cursor: "pointer",
                                background: isActive ? "linear-gradient(90deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)" : "transparent",
                                color: isActive ? "#3b82f6" : "#94a3b8",
                                borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <Icon size={19} color={isActive ? "#3b82f6" : "#64748b"} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* User Footer & Logout */}
            <div style={{
                padding: "16px 20px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                    <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(59, 130, 246, 0.2)",
                        color: "#60a5fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "0.9rem"
                    }}>
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user?.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user?.email}
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    title="Sign Out"
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
