import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function AuditLogsView() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState("");

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (actionFilter) params.append("action", actionFilter);

            const res = await fetch(`/api/audit?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [actionFilter]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>System Audit Trail</h3>
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Security & compliance log of critical actions</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <select className="form-select" style={{ width: "180px" }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                        <option value="">All Actions</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="REGISTER">REGISTER</option>
                        <option value="TICKET_CREATE">TICKET_CREATE</option>
                        <option value="TICKET_ASSIGN">TICKET_ASSIGN</option>
                        <option value="TICKET_RESOLVE">TICKET_RESOLVE</option>
                        <option value="USER_CREATE">USER_CREATE</option>
                        <option value="ASSET_CREATE">ASSET_CREATE</option>
                    </select>
                    <button onClick={fetchAuditLogs} className="btn btn-secondary btn-sm">
                        <RefreshCw size={15} /> Refresh Logs
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: "20px" }}>
                <div className="sd-table-container">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity Target</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Loading audit logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No audit log entries found.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id}>
                                        <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleString()}</td>
                                        <td style={{ fontWeight: "600", color: "#3b82f6" }}>{log.user?.name || "System"}</td>
                                        <td>
                                            <span className="badge" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd" }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.entity} #{log.entityId?.substring(0, 8) || ""}</td>
                                        <td style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>{JSON.stringify(log.details || {})}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
