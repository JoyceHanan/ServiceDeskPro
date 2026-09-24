import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { injectGlobalStyles } from "./style/common";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import TicketsView from "./components/TicketsView";
import TicketDetailModal from "./components/TicketDetailModal";
import CreateTicketModal from "./components/CreateTicketModal";
import AssetsView from "./components/AssetsView";
import KnowledgeView from "./components/KnowledgeView";
import UsersView from "./components/UsersView";
import DepartmentsView from "./components/DepartmentsView";
import CategoriesView from "./components/CategoriesView";
import SLAManagementView from "./components/SLAManagementView";
import VendorsView from "./components/VendorsView";
import NotificationsView from "./components/NotificationsView";
import AuditLogsView from "./components/AuditLogsView";
import OrganizationsView from "./components/OrganizationsView";
import ProfileView from "./components/ProfileView";

export default function App() {
    const { user, loading, toast } = useAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        injectGlobalStyles();
    }, []);

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0f172a",
                color: "#60a5fa",
                fontSize: "1.1rem",
                fontWeight: "700"
            }}>
                Loading ServiceDesk Pro...
            </div>
        );
    }

    if (!user) {
        return <Auth />;
    }

    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <DashboardView
                        setActiveTab={setActiveTab}
                        onSelectTicket={(ticket) => setSelectedTicket(ticket)}
                        onOpenCreateTicket={() => setShowCreateModal(true)}
                    />
                );
            case "tickets":
                return (
                    <TicketsView
                        onSelectTicket={(ticket) => setSelectedTicket(ticket)}
                        onOpenCreateTicket={() => setShowCreateModal(true)}
                    />
                );
            case "assets":
                return <AssetsView />;
            case "knowledge":
                return <KnowledgeView />;
            case "users":
                return <UsersView />;
            case "departments":
                return <DepartmentsView />;
            case "categories":
                return <CategoriesView />;
            case "sla":
                return <SLAManagementView />;
            case "vendors":
                return <VendorsView />;
            case "notifications":
                return <NotificationsView />;
            case "audit":
                return <AuditLogsView />;
            case "organizations":
                return <OrganizationsView />;
            case "profile":
                return <ProfileView />;
            default:
                return (
                    <DashboardView
                        setActiveTab={setActiveTab}
                        onSelectTicket={(ticket) => setSelectedTicket(ticket)}
                        onOpenCreateTicket={() => setShowCreateModal(true)}
                    />
                );
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a" }}>
            {/* Global Floating Toast Alert */}
            {toast && (
                <div style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 9999,
                    padding: "14px 22px",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    color: "#ffffff",
                    background: toast.type === "error" ? "#ef4444" : toast.type === "success" ? "#10b981" : "#3b82f6",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                    animation: "fadeIn 0.2s ease-out"
                }}>
                    {toast.message}
                </div>
            )}

            {/* Navigation Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Header
                    activeTab={activeTab}
                    onOpenCreateTicket={() => setShowCreateModal(true)}
                    setActiveTab={setActiveTab}
                />
                
                <main style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
                    {renderActiveTab()}
                </main>
            </div>

            {/* Global Ticket Detail Modal */}
            {selectedTicket && (
                <TicketDetailModal
                    ticketId={selectedTicket._id}
                    onClose={() => setSelectedTicket(null)}
                />
            )}

            {/* Global Create Ticket Modal */}
            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
}
