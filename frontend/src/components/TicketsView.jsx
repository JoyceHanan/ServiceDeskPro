import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { statusColors, priorityColors } from "../style/common";
import { Search, Filter, Plus, Clock, AlertCircle, ArrowUpDown, Tag, Bookmark } from "lucide-react";

export default function TicketsView({ onSelectTicket, onOpenCreateTicket }) {
    const { user, showToast } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [viewTab, setViewTab] = useState("all");
    const [savedFilters, setSavedFilters] = useState([]);
    const [newFilterName, setNewFilterName] = useState("");
    const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);
            if (priorityFilter) params.append("priority", priorityFilter);
            if (search) params.append("search", search);
            if (viewTab !== "all") params.append("view", viewTab);

            const res = await fetch(`/api/tickets?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setTickets(data.tickets || []);
            }
        } catch (err) {
            console.error("Failed to fetch tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedFilters = async () => {
        try {
            const res = await fetch("/api/filters");
            const data = await res.json();
            if (data.success) {
                setSavedFilters(data.filters || []);
            }
        } catch (err) {}
    };

    useEffect(() => {
        fetchTickets();
        fetchSavedFilters();
    }, [statusFilter, priorityFilter, viewTab]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchTickets();
    };

    const handleSaveFilter = async (e) => {
        e.preventDefault();
        if (!newFilterName) return;
        try {
            const res = await fetch("/api/filters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFilterName,
                    filterCriteria: { statusFilter, priorityFilter, search }
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Filter view saved!", "success");
                setShowSaveFilterModal(false);
                setNewFilterName("");
                fetchSavedFilters();
            }
        } catch (err) {
            showToast("Failed to save filter", "error");
        }
    };

    const applySavedFilter = (filter) => {
        if (filter.filterCriteria) {
            setStatusFilter(filter.filterCriteria.statusFilter || "");
            setPriorityFilter(filter.filterCriteria.priorityFilter || "");
            setSearch(filter.filterCriteria.search || "");
        }
    };

    // Calculate SLA deadline status text and urgency styling
    const renderSLADueBadge = (ticket) => {
        if (ticket.status === "Resolved" || ticket.status === "Closed") {
            return <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>Completed</span>;
        }

        if (!ticket.resolutionDueAt) {
            return <span style={{ fontSize: "0.8rem", color: "#64748b" }}>N/A</span>;
        }

        const due = new Date(ticket.resolutionDueAt);
        const now = new Date();
        const diffHours = Math.round((due - now) / (1000 * 60 * 60));

        if (diffHours < 0 || ticket.slaBreached) {
            return (
                <span className="badge" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                    <AlertCircle size={12} /> BREACHED ({Math.abs(diffHours)}h ago)
                </span>
            );
        } else if (diffHours < 4) {
            return (
                <span className="badge" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                    <Clock size={12} /> URGENT ({diffHours}h left)
                </span>
            );
        } else {
            return (
                <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                    <Clock size={12} /> {diffHours}h left
                </span>
            );
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header Toolbar */}
            <div className="glass-card" style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
                <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: "38px" }}
                            placeholder="Search ticket title or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">Search</button>
                </form>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <select
                        className="form-select"
                        style={{ width: "150px" }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                        <option value="Reopened">Reopened</option>
                    </select>

                    <select
                        className="form-select"
                        style={{ width: "150px" }}
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>

                    {savedFilters.length > 0 && (
                        <select
                            className="form-select"
                            style={{ width: "160px" }}
                            onChange={(e) => {
                                const filter = savedFilters.find(f => f._id === e.target.value);
                                if (filter) applySavedFilter(filter);
                            }}
                        >
                            <option value="">Saved Views</option>
                            {savedFilters.map(f => (
                                <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => setShowSaveFilterModal(true)}
                        className="btn btn-secondary btn-sm"
                        title="Save Current Filter View"
                    >
                        <Bookmark size={15} /> Save View
                    </button>

                    <button onClick={onOpenCreateTicket} className="btn btn-primary">
                        <Plus size={18} /> New Ticket
                    </button>
                </div>
            </div>

            {/* Technician view tabs */}
            {user?.role === "Technician" && (
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={() => setViewTab("all")}
                        className={`btn ${viewTab === "all" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    >
                        All Department Tickets
                    </button>
                    <button
                        onClick={() => setViewTab("my-assigned")}
                        className={`btn ${viewTab === "my-assigned" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    >
                        Assigned To Me
                    </button>
                    <button
                        onClick={() => setViewTab("unassigned")}
                        className={`btn ${viewTab === "unassigned" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    >
                        Unassigned Queue
                    </button>
                </div>
            )}

            {/* Save Filter Modal */}
            {showSaveFilterModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "420px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>Save Ticket View</h3>
                        <form onSubmit={handleSaveFilter} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">View Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g. Critical Unresolved"
                                    value={newFilterName}
                                    onChange={(e) => setNewFilterName(e.target.value)}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowSaveFilterModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save View</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket List Table */}
            <div className="glass-card" style={{ padding: "20px" }}>
                <div className="sd-table-container">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>ID / Title</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>SLA Resolution</th>
                                <th>Requester</th>
                                <th>Assigned Tech</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "30px" }}>
                                        Loading ticket records...
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                                        No tickets match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => {
                                    const statusStyle = statusColors[ticket.status] || statusColors["Open"];
                                    const priorityStyle = priorityColors[ticket.priority] || priorityColors["Medium"];
                                    return (
                                        <tr key={ticket._id} style={{ cursor: "pointer" }} onClick={() => onSelectTicket(ticket)}>
                                            <td style={{ fontWeight: "600" }}>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>#{ticket._id.substring(ticket._id.length - 6)}</div>
                                                <div style={{ color: "#f8fafc", marginTop: "2px" }}>{ticket.title}</div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                                                    {ticket.category?.name || "General"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: priorityStyle.bg, color: priorityStyle.text }}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td>{renderSLADueBadge(ticket)}</td>
                                            <td>
                                                <div style={{ fontSize: "0.85rem", fontWeight: "500" }}>{ticket.requester?.name || "Unknown"}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{ticket.requester?.email}</div>
                                            </td>
                                            <td>
                                                {ticket.assignedTechnician ? (
                                                    <span style={{ fontSize: "0.85rem", color: "#a78bfa" }}>{ticket.assignedTechnician.name}</span>
                                                ) : (
                                                    <span style={{ fontSize: "0.8rem", color: "#64748b", italic: "true" }}>Unassigned</span>
                                                )}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => onSelectTicket(ticket)} className="btn btn-secondary btn-sm">
                                                    Open
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
        </div>
    );
}
