import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { priorityColors } from "../style/common";
import { Clock, Plus, RefreshCw, AlertTriangle, Edit } from "lucide-react";

export default function SLAManagementView() {
    const { user, showToast } = useAuth();
    const [slas, setSlas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSla, setEditingSla] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        priority: "Medium",
        responseTimeHours: 12,
        resolutionTimeHours: 48,
        businessHoursOnly: false,
        escalationEmail: ""
    });

    const fetchSLAs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sla");
            const data = await res.json();
            if (data.success) {
                setSlas(data.slas || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSLAs();
    }, []);

    const handleSaveSLA = async (e) => {
        e.preventDefault();
        try {
            const url = editingSla ? `/api/sla/${editingSla._id}` : "/api/sla";
            const method = editingSla ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save SLA");

            showToast("SLA Policy saved", "success");
            setShowModal(false);
            fetchSLAs();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const triggerSLACheck = async () => {
        try {
            const res = await fetch("/api/sla/evaluate-breaches", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                showToast(data.message, "success");
            }
        } catch (err) {
            showToast("SLA check failed", "error");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Service Level Agreement (SLA) Targets</h3>
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Automated response and resolution time enforcement</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={triggerSLACheck} className="btn btn-secondary btn-sm">
                        <RefreshCw size={15} /> Evaluate Breaches Now
                    </button>
                    <button onClick={() => { setEditingSla(null); setFormData({ name: "", priority: "Medium", responseTimeHours: 12, resolutionTimeHours: 48, businessHoursOnly: false, escalationEmail: "" }); setShowModal(true); }} className="btn btn-primary btn-sm">
                        <Plus size={16} /> New SLA Policy
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {slas.map(sla => {
                    const pStyle = priorityColors[sla.priority] || priorityColors["Medium"];
                    return (
                        <div key={sla._id} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <span className="badge" style={{ background: pStyle.bg, color: pStyle.text }}>
                                        {sla.priority} Priority
                                    </span>
                                    <button onClick={() => { setEditingSla(sla); setFormData({ name: sla.name, priority: sla.priority, responseTimeHours: sla.responseTimeHours, resolutionTimeHours: sla.resolutionTimeHours, businessHoursOnly: sla.businessHoursOnly, escalationEmail: sla.escalationEmail || "" }); setShowModal(true); }} className="btn btn-secondary btn-sm">
                                        <Edit size={14} />
                                    </button>
                                </div>
                                <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{sla.name}</h4>

                                <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                                        <span>First Response Due:</span>
                                        <span style={{ fontWeight: "700", color: "#60a5fa" }}>{sla.responseTimeHours} hours</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                                        <span>Full Resolution Due:</span>
                                        <span style={{ fontWeight: "700", color: "#34d399" }}>{sla.resolutionTimeHours} hours</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "12px", fontSize: "0.78rem", color: "#64748b" }}>
                                Business Hours Only: {sla.businessHoursOnly ? "Yes" : "No (24/7)"}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "480px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>{editingSla ? "Edit SLA Policy" : "Create SLA Policy"}</h3>
                        <form onSubmit={handleSaveSLA} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Policy Name</label>
                                <input type="text" required className="form-input" placeholder="e.g. Critical 4h Resolution" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Target Priority</label>
                                <select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Response (Hours)</label>
                                    <input type="number" min={1} required className="form-input" value={formData.responseTimeHours} onChange={(e) => setFormData({ ...formData, responseTimeHours: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Resolution (Hours)</label>
                                    <input type="number" min={1} required className="form-input" value={formData.resolutionTimeHours} onChange={(e) => setFormData({ ...formData, resolutionTimeHours: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Escalation Email</label>
                                <input type="email" className="form-input" placeholder="manager@company.com" value={formData.escalationEmail} onChange={(e) => setFormData({ ...formData, escalationEmail: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save SLA Policy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
