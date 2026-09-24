import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, HardDrive, User, Building2, Wrench, Trash2, Edit } from "lucide-react";

export default function AssetsView() {
    const { user, showToast } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);

    const [usersList, setUsersList] = useState([]);
    const [departmentsList, setDepartmentsList] = useState([]);

    const [formData, setFormData] = useState({
        assetTag: "",
        name: "",
        category: "Laptop",
        serialNumber: "",
        status: "Available",
        department: "",
        assignedTo: "",
        cost: 0,
        notes: ""
    });

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);
            if (search) params.append("search", search);

            const res = await fetch(`/api/assets?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setAssets(data.assets || []);
            }
        } catch (err) {
            console.error("Failed to load assets:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
        // Fetch reference lists for assignment
        Promise.all([
            fetch("/api/users").then(r => r.json()),
            fetch("/api/departments").then(r => r.json())
        ]).then(([uData, dData]) => {
            if (uData.success) setUsersList(uData.users || []);
            if (dData.success) setDepartmentsList(dData.departments || []);
        }).catch(() => {});
    }, [statusFilter]);

    const handleSaveAsset = async (e) => {
        e.preventDefault();
        try {
            const url = editingAsset ? `/api/assets/${editingAsset._id}` : "/api/assets";
            const method = editingAsset ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to save asset");
            }

            showToast(editingAsset ? "Asset updated" : "Asset created", "success");
            setShowModal(false);
            setEditingAsset(null);
            fetchAssets();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleDeleteAsset = async (id) => {
        if (!window.confirm("Are you sure you want to delete this asset?")) return;
        try {
            const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("Asset deleted", "info");
                fetchAssets();
            }
        } catch (err) {
            showToast("Failed to delete asset", "error");
        }
    };

    const isManager = ["Asset Manager", "System Admin", "IT Manager"].includes(user?.role);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header Controls */}
            <div className="glass-card" style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "260px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: "38px" }}
                            placeholder="Search asset tag, name, or serial number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchAssets} className="btn btn-secondary">Search</button>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <select
                        className="form-select"
                        style={{ width: "160px" }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Under Repair">Under Repair</option>
                        <option value="Procured">Procured</option>
                        <option value="Retired">Retired</option>
                    </select>

                    {isManager && (
                        <button
                            onClick={() => {
                                setEditingAsset(null);
                                setFormData({
                                    assetTag: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
                                    name: "",
                                    category: "Laptop",
                                    serialNumber: "",
                                    status: "Available",
                                    department: "",
                                    assignedTo: "",
                                    cost: 0,
                                    notes: ""
                                });
                                setShowModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            <Plus size={18} /> Add Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Assets Table */}
            <div className="glass-card" style={{ padding: "20px" }}>
                <div className="sd-table-container">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Asset Tag</th>
                                <th>Name & Category</th>
                                <th>Serial Number</th>
                                <th>Status</th>
                                <th>Assigned User</th>
                                <th>Department</th>
                                {isManager && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Loading assets...</td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No hardware assets found.</td>
                                </tr>
                            ) : (
                                assets.map(asset => (
                                    <tr key={asset._id}>
                                        <td style={{ fontWeight: "700", color: "#3b82f6" }}>{asset.assetTag}</td>
                                        <td>
                                            <div style={{ fontWeight: "600" }}>{asset.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{asset.category}</div>
                                        </td>
                                        <td>{asset.serialNumber || "N/A"}</td>
                                        <td>
                                            <span className="badge" style={{
                                                background: asset.status === "Assigned" ? "rgba(139, 92, 246, 0.15)" : asset.status === "Available" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                                color: asset.status === "Assigned" ? "#a78bfa" : asset.status === "Available" ? "#34d399" : "#fbbf24"
                                            }}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td>{asset.assignedTo?.name || "-"}</td>
                                        <td>{asset.department?.name || "-"}</td>
                                        {isManager && (
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingAsset(asset);
                                                            setFormData({
                                                                assetTag: asset.assetTag,
                                                                name: asset.name,
                                                                category: asset.category,
                                                                serialNumber: asset.serialNumber,
                                                                status: asset.status,
                                                                department: asset.department?._id || "",
                                                                assignedTo: asset.assignedTo?._id || "",
                                                                cost: asset.cost || 0,
                                                                notes: asset.notes || ""
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAsset(asset._id)}
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Asset Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "18px" }}>
                            {editingAsset ? "Edit Asset" : "Add Hardware Asset"}
                        </h3>
                        <form onSubmit={handleSaveAsset} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Asset Tag</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        value={formData.assetTag}
                                        onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Asset Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="e.g. MacBook Pro 16"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Laptop">Laptop</option>
                                        <option value="Desktop">Desktop</option>
                                        <option value="Monitor">Monitor</option>
                                        <option value="Mobile">Mobile Device</option>
                                        <option value="Printer">Printer</option>
                                        <option value="Network">Network Gear</option>
                                        <option value="General">Other Hardware</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Serial Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="SN-90182312"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Under Repair">Under Repair</option>
                                        <option value="Procured">Procured</option>
                                        <option value="Replaced">Replaced</option>
                                        <option value="Retired">Retired</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Assigned User</label>
                                    <select
                                        className="form-select"
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {usersList.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Department</label>
                                <select
                                    className="form-select"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="">None / General</option>
                                    {departmentsList.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
