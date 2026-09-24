import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Layers, Plus, Edit } from "lucide-react";

export default function CategoriesView() {
    const { user, showToast } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingCat ? `/api/categories/${editingCat._id}` : "/api/categories";
            const method = editingCat ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save category");

            showToast("Category saved", "success");
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const isStaff = ["System Admin", "IT Manager"].includes(user?.role);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Ticket Categories</h3>
                {isStaff && (
                    <button onClick={() => { setEditingCat(null); setName(""); setDescription(""); setShowModal(true); }} className="btn btn-primary btn-sm">
                        <Plus size={16} /> Add Category
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {categories.map(cat => (
                    <div key={cat._id} className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", marginBottom: "8px" }}>
                                Category
                            </span>
                            <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{cat.name}</h4>
                            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "6px" }}>{cat.description || "Default category"}</p>
                        </div>
                        {isStaff && (
                            <button onClick={() => { setEditingCat(cat); setName(cat.name); setDescription(cat.description || ""); setShowModal(true); }} className="btn btn-secondary btn-sm">
                                <Edit size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "440px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>{editingCat ? "Edit Category" : "Add Category"}</h3>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Category Name</label>
                                <input type="text" required className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea rows={3} className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
