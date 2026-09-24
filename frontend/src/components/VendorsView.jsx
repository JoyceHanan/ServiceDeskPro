import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Store, Plus, Edit } from "lucide-react";

export default function VendorsView() {
    const { user, showToast } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    const [formData, setFormData] = useState({ name: "", contactPerson: "", email: "", phone: "", address: "" });

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/vendors");
            const data = await res.json();
            if (data.success) setVendors(data.vendors || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVendors(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingVendor ? `/api/vendors/${editingVendor._id}` : "/api/vendors";
            const method = editingVendor ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save vendor");

            showToast("Vendor saved", "success");
            setShowModal(false);
            fetchVendors();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const isStaff = ["Asset Manager", "System Admin", "IT Manager"].includes(user?.role);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Hardware & Software Vendors</h3>
                {isStaff && (
                    <button onClick={() => { setEditingVendor(null); setFormData({ name: "", contactPerson: "", email: "", phone: "", address: "" }); setShowModal(true); }} className="btn btn-primary btn-sm">
                        <Plus size={16} /> Add Vendor
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {vendors.map(v => (
                    <div key={v._id} className="glass-card" style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Store size={20} />
                            </div>
                            {isStaff && (
                                <button onClick={() => { setEditingVendor(v); setFormData({ name: v.name, contactPerson: v.contactPerson || "", email: v.email || "", phone: v.phone || "", address: v.address || "" }); setShowModal(true); }} className="btn btn-secondary btn-sm">
                                    <Edit size={14} />
                                </button>
                            )}
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{v.name}</h4>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div>Contact: {v.contactPerson || "N/A"}</div>
                            <div>Email: {v.email || "N/A"}</div>
                            <div>Phone: {v.phone || "N/A"}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "480px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>{editingVendor ? "Edit Vendor" : "Add Vendor"}</h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Vendor Company Name</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Contact Person</label>
                                <input type="text" className="form-input" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Phone</label>
                                    <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Vendor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
