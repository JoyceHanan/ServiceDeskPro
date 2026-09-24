import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Building2, Plus, Edit, User, Trash2 } from "lucide-react";

export default function DepartmentsView() {
    const { user, showToast } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [managers, setManagers] = useState([]);

    const [formData, setFormData] = useState({ name: "", description: "", manager: "" });

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/departments");
            const data = await res.json();
            if (data.success) {
                setDepartments(data.departments || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetch("/api/users")
            .then(r => r.json())
            .then(d => { if (d.success) setManagers(d.users || []); })
            .catch(() => {});
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingDept ? `/api/departments/${editingDept._id}` : "/api/departments";
            const method = editingDept ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Operation failed");

            showToast("Department saved", "success");
            setShowModal(false);
            fetchDepartments();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const isStaff = ["System Admin", "IT Manager"].includes(user?.role);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Enterprise Departments</h3>
                {isStaff && (
                    <button onClick={() => { setEditingDept(null); setFormData({ name: "", description: "", manager: "" }); setShowModal(true); }} className="btn btn-primary">
                        <Plus size={18} /> Add Department
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {departments.map(dept => (
                    <div key={dept._id} className="glass-card" style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Building2 size={22} />
                            </div>
                            {isStaff && (
                                <button onClick={() => { setEditingDept(dept); setFormData({ name: dept.name, description: dept.description, manager: dept.manager?._id || "" }); setShowModal(true); }} className="btn btn-secondary btn-sm">
                                    <Edit size={14} /> Edit
                                </button>
                            )}
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{dept.name}</h4>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "8px 0 16px 0" }}>{dept.description || "No description provided."}</p>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
                            Manager: <span style={{ color: "#60a5fa", fontWeight: "600" }}>{dept.manager?.name || "Unassigned"}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "480px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>{editingDept ? "Edit Department" : "Add Department"}</h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Department Name</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea rows={3} className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Department Manager</label>
                                <select className="form-select" value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })}>
                                    <option value="">-- Select Manager --</option>
                                    {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                                </select>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Department</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
