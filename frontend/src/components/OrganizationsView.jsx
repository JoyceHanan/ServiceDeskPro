import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, Plus, Edit } from "lucide-react";

export default function OrganizationsView() {
    const { user, showToast } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);

    const [formData, setFormData] = useState({ name: "", domain: "", contactEmail: "" });

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/organizations");
            const data = await res.json();
            if (data.success) setOrganizations(data.organizations || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrgs(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingOrg ? `/api/organizations/${editingOrg._id}` : "/api/organizations";
            const method = editingOrg ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save organization");

            showToast("Organization saved", "success");
            setShowModal(false);
            fetchOrgs();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Enterprise Organizations</h3>
                <button onClick={() => { setEditingOrg(null); setFormData({ name: "", domain: "", contactEmail: "" }); setShowModal(true); }} className="btn btn-primary btn-sm">
                    <Plus size={16} /> Add Organization
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {organizations.map(org => (
                    <div key={org._id} className="glass-card" style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Globe size={20} />
                            </div>
                            <button onClick={() => { setEditingOrg(org); setFormData({ name: org.name, domain: org.domain || "", contactEmail: org.contactEmail || "" }); setShowModal(true); }} className="btn btn-secondary btn-sm">
                                <Edit size={14} />
                            </button>
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{org.name}</h4>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "8px" }}>Domain: {org.domain || "N/A"}</div>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>Contact: {org.contactEmail || "N/A"}</div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "440px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>{editingOrg ? "Edit Organization" : "Add Organization"}</h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Organization Name</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Domain Name</label>
                                <input type="text" className="form-input" placeholder="company.com" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Contact Email</label>
                                <input type="email" className="form-input" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Organization</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
