import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { statusColors, priorityColors } from "../style/common";
import { 
    X, 
    Clock, 
    User, 
    MessageSquare, 
    Lock, 
    CheckCircle2, 
    RotateCcw, 
    UserPlus, 
    Sparkles, 
    BookOpen, 
    ShieldAlert, 
    Send,
    PlusCircle
} from "lucide-react";

export default function TicketDetailModal({ ticketId, onClose, onRefresh }) {
    const { user, showToast } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [internalNoteText, setInternalNoteText] = useState("");
    const [resolutionNote, setResolutionNote] = useState("");
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [workLogs, setWorkLogs] = useState([]);
    const [showWorkLogModal, setShowWorkLogModal] = useState(false);
    const [workLogData, setWorkLogData] = useState({ description: "", timeSpentMinutes: 30 });
    const [aiSuggestions, setAiSuggestions] = useState([]);

    const fetchTicketDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}`);
            const data = await res.json();
            if (data.success && data.ticket) {
                setTicket(data.ticket);
            }
        } catch (err) {
            console.error("Failed to load ticket:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkLogs = async () => {
        try {
            const res = await fetch(`/api/worklogs/ticket/${ticketId}`);
            const data = await res.json();
            if (data.success) {
                setWorkLogs(data.worklogs || []);
            }
        } catch (err) {}
    };

    const fetchTechnicians = async () => {
        try {
            const res = await fetch("/api/users?role=staff");
            const data = await res.json();
            if (data.success && data.users) {
                let list = data.users;
                if (user && ["Technician", "IT Manager", "System Admin"].includes(user.role)) {
                    if (!list.some(u => u._id === user._id)) {
                        list = [user, ...list];
                    }
                }
                setTechnicians(list);
            }
        } catch (err) {}
    };

    const fetchAISuggestions = async () => {
        if (!ticket) return;
        try {
            const res = await fetch("/api/knowledge/ai-suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: ticket.title, ticketText: ticket.description })
            });
            const data = await res.json();
            if (data.success) {
                setAiSuggestions(data.suggestions || []);
            }
        } catch (err) {}
    };

    useEffect(() => {
        if (ticketId) {
            fetchTicketDetails();
            fetchWorkLogs();
            fetchTechnicians();
        }
    }, [ticketId]);

    useEffect(() => {
        if (ticket) {
            fetchAISuggestions();
        }
    }, [ticket?.title]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: commentText })
            });
            const data = await res.json();
            if (data.success) {
                setCommentText("");
                showToast("Comment added", "success");
                fetchTicketDetails();
            }
        } catch (err) {
            showToast("Failed to add comment", "error");
        }
    };

    const handleAddInternalNote = async (e) => {
        e.preventDefault();
        if (!internalNoteText.trim()) return;
        try {
            const res = await fetch(`/api/tickets/${ticketId}/internal-notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: internalNoteText })
            });
            const data = await res.json();
            if (data.success) {
                setInternalNoteText("");
                showToast("Internal note added", "success");
                fetchTicketDetails();
            }
        } catch (err) {
            showToast("Failed to add internal note", "error");
        }
    };

    const handleAssignTechnician = async (techId) => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assignedTechnician: techId })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Technician assigned", "success");
                fetchTicketDetails();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            showToast("Failed to assign technician", "error");
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Status updated to ${newStatus}`, "success");
                fetchTicketDetails();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            showToast("Failed to update status", "error");
        }
    };

    const handleResolveTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/tickets/${ticketId}/resolve`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resolutionNote })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Ticket resolved!", "success");
                setShowResolveModal(false);
                fetchTicketDetails();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            showToast("Failed to resolve ticket", "error");
        }
    };

    const handleReopenTicket = async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/reopen`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Reopened by user" })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Ticket reopened", "info");
                fetchTicketDetails();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            showToast("Failed to reopen ticket", "error");
        }
    };

    const handleAddWorkLog = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/worklogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticket: ticketId,
                    description: workLogData.description,
                    timeSpentMinutes: workLogData.timeSpentMinutes
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Work log recorded", "success");
                setShowWorkLogModal(false);
                setWorkLogData({ description: "", timeSpentMinutes: 30 });
                fetchWorkLogs();
            }
        } catch (err) {
            showToast("Failed to log work", "error");
        }
    };

    if (loading || !ticket) {
        return (
            <div className="modal-overlay">
                <div className="modal-content" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "#94a3b8" }}>Loading ticket details...</div>
                </div>
            </div>
        );
    }

    const statusStyle = statusColors[ticket.status] || statusColors["Open"];
    const priorityStyle = priorityColors[ticket.priority] || priorityColors["Medium"];
    const isStaff = ["Technician", "IT Manager", "System Admin"].includes(user?.role);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "880px", padding: "32px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b" }}>#{ticket._id}</span>
                            <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                                {ticket.status}
                            </span>
                            <span className="badge" style={{ background: priorityStyle.bg, color: priorityStyle.text }}>
                                {ticket.priority} Priority
                            </span>
                            {ticket.slaBreached && (
                                <span className="badge" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
                                    SLA BREACHED
                                </span>
                            )}
                        </div>
                        <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#f8fafc" }}>{ticket.title}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Grid Layout: Details & Controls */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                    {/* Left Main Body */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Description Box */}
                        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "18px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                            <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Description</h4>
                            <p style={{ fontSize: "0.95rem", color: "#f8fafc", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{ticket.description}</p>
                        </div>

                        {/* AI KB Article Suggestions for Technicians */}
                        {isStaff && aiSuggestions.length > 0 && (
                            <div style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
                                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#a78bfa", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                    <Sparkles size={16} /> AI Knowledge Suggestions
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {aiSuggestions.map(kb => (
                                        <div key={kb._id} style={{ fontSize: "0.85rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <BookOpen size={14} color="#60a5fa" />
                                            <span style={{ fontWeight: "600" }}>{kb.title}</span>
                                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>({kb.category})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Public Comments Section */}
                        <div>
                            <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <MessageSquare size={18} color="#3b82f6" /> Comments ({ticket.comments?.length || 0})
                            </h4>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto", marginBottom: "14px" }}>
                                {ticket.comments?.length === 0 ? (
                                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No comments yet.</div>
                                ) : (
                                    ticket.comments.map(c => (
                                        <div key={c._id} style={{ background: "rgba(15, 23, 42, 0.5)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "#60a5fa" }}>{c.user?.name || "User"} ({c.user?.role})</span>
                                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(c.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>{c.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleAddComment} style={{ display: "flex", gap: "10px" }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary btn-sm">
                                    <Send size={16} /> Send
                                </button>
                            </form>
                        </div>

                        {/* Internal Notes Section (Staff only) */}
                        {isStaff && (
                            <div style={{ marginTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
                                <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b" }}>
                                    <Lock size={18} /> Internal Notes (Staff Only)
                                </h4>

                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", marginBottom: "12px" }}>
                                    {ticket.internalNotes?.map(n => (
                                        <div key={n._id} style={{ background: "rgba(245, 158, 11, 0.08)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                                            <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: "700" }}>
                                                {n.user?.name} • {new Date(n.createdAt).toLocaleString()}
                                            </div>
                                            <p style={{ fontSize: "0.85rem", color: "#f8fafc", marginTop: "4px" }}>{n.text}</p>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleAddInternalNote} style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add internal note for IT staff..."
                                        value={internalNoteText}
                                        onChange={(e) => setInternalNoteText(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-secondary btn-sm">Add Note</button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right Control Sidebar */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        {/* Status Action Buttons */}
                        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Actions</h4>
                            
                            {ticket.status !== "Resolved" && ticket.status !== "Closed" && isStaff && (
                                <button onClick={() => setShowResolveModal(true)} className="btn btn-success" style={{ width: "100%" }}>
                                    <CheckCircle2 size={16} /> Resolve Ticket
                                </button>
                            )}

                            {(ticket.status === "Resolved" || ticket.status === "Closed") && (
                                <button onClick={handleReopenTicket} className="btn btn-secondary" style={{ width: "100%" }}>
                                    <RotateCcw size={16} /> Reopen Ticket
                                </button>
                            )}

                            {isStaff && (
                                <div>
                                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Update Status</label>
                                    <select
                                        className="form-select"
                                        value={ticket.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            )}

                            {isStaff && (
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <label className="form-label" style={{ fontSize: "0.75rem", margin: 0 }}>Assign Technician</label>
                                        {user && (
                                            <button
                                                type="button"
                                                onClick={() => handleAssignTechnician(user._id)}
                                                style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                                            >
                                                Assign to Me
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        className="form-select"
                                        value={ticket.assignedTechnician?._id || ""}
                                        onChange={(e) => handleAssignTechnician(e.target.value)}
                                    >
                                        <option value="">-- Assign Technician --</option>
                                        {technicians.map(tech => (
                                            <option key={tech._id} value={tech._id}>
                                                {tech.name} ({tech.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Metadata Details Card */}
                        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>Requester:</span>
                                <div style={{ fontWeight: "700", color: "#f8fafc" }}>{ticket.requester?.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{ticket.requester?.email}</div>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Category:</span>
                                <div style={{ fontWeight: "600", color: "#60a5fa" }}>{ticket.category?.name || "General"}</div>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Resolution Due (SLA):</span>
                                <div style={{ fontWeight: "600", color: ticket.slaBreached ? "#ef4444" : "#f8fafc" }}>
                                    {ticket.resolutionDueAt ? new Date(ticket.resolutionDueAt).toLocaleString() : "N/A"}
                                </div>
                            </div>
                        </div>

                        {/* Technician Work Logs */}
                        {isStaff && (
                            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Work Logs</h4>
                                    <button onClick={() => setShowWorkLogModal(true)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "2px" }}>
                                        <PlusCircle size={14} /> Log Time
                                    </button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {workLogs.length === 0 ? (
                                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>No work time logged yet.</div>
                                    ) : (
                                        workLogs.map(wl => (
                                            <div key={wl._id} style={{ fontSize: "0.78rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                                                <span style={{ fontWeight: "700", color: "#60a5fa" }}>{wl.timeSpentMinutes} mins</span> by {wl.technician?.name}
                                                <div style={{ color: "#94a3b8" }}>{wl.description}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Resolve Confirmation Modal */}
            {showResolveModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: "480px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "14px" }}>Resolve Ticket</h3>
                        <form onSubmit={handleResolveTicket} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Resolution Summary Note</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="form-textarea"
                                    placeholder="Explain how the issue was fixed..."
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" onClick={() => setShowResolveModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-success">Complete Resolution</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Work Log Modal */}
            {showWorkLogModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: "440px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "14px" }}>Record Technician Work Log</h3>
                        <form onSubmit={handleAddWorkLog} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Time Spent (Minutes)</label>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    className="form-input"
                                    value={workLogData.timeSpentMinutes}
                                    onChange={(e) => setWorkLogData({ ...workLogData, timeSpentMinutes: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Work Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="form-textarea"
                                    placeholder="Described actions taken..."
                                    value={workLogData.description}
                                    onChange={(e) => setWorkLogData({ ...workLogData, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" onClick={() => setShowWorkLogModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Work Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
