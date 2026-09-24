import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, User, Shield, Phone, Building2, UserX, Edit } from "lucide-react";

export default function UsersView() {
    const { user, showToast } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [departments, setDepartments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "Employee",
        department: "",
        phone: "",
        isActive: true
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter) params.append("role", roleFilter);
            if (search) params.append("search", search);

            const res = await fetch(`/api/users?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetch("/api/departments")
            .then(r => r.json())
            .then(d => { if (d.success) setDepartments(d.departments || []); })
            .catch(() => {});
    }, [roleFilter]);

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
            const method = editingUser ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to save user");
            }

            showToast(editingUser ? "User updated" : "User created", "success");
            setShowModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleDeactivateUser = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this account?")) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                showToast("User deactivated", "info");
                fetchUsers();
            }
        } catch (err) {
            showToast("Failed to deactivate user", "error");
        }
    };

    const isAdmin = user?.role === "System Admin";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "260px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: "38px" }}
                            placeholder="Search user by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchUsers} className="btn btn-secondary">Search</button>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <select
                        className="form-select"
                        style={{ width: "160px" }}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="System Admin">System Admin</option>
                        <option value="IT Manager">IT Manager</option>
                        <option value="Technician">Technician</option>
                        <option value="Employee">Employee</option>
                        <option value="Asset Manager">Asset Manager</option>
                    </select>

                    {isAdmin && (
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({ name: "", email: "", password: "", role: "Employee", department: "", phone: "", isActive: true });
                                setShowModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            <Plus size={18} /> Add User
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: "20px" }}>
                <div className="sd-table-container">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Phone</th>
                                <th>Status</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No users found.</td></tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ fontWeight: "700", color: "#f8fafc" }}>{u.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{u.email}</div>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>{u.department?.name || "General"}</td>
                                        <td>{u.phone || "N/A"}</td>
                                        <td>
                                            <span className="badge" style={{
                                                background: u.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                                color: u.isActive ? "#34d399" : "#f87171"
                                            }}>
                                                {u.isActive ? "Active" : "Deactivated"}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(u);
                                                            setFormData({
                                                                name: u.name,
                                                                email: u.email,
                                                                password: "",
                                                                role: u.role,
                                                                department: u.department?._id || "",
                                                                phone: u.phone || "",
                                                                isActive: u.isActive
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    {u.isActive && (
                                                        <button onClick={() => handleDeactivateUser(u._id)} className="btn btn-danger btn-sm">
                                                            <UserX size={14} />
                                                        </button>
                                                    )}
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

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "540px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
                            {editingUser ? "Edit User Account" : "Create New User Account"}
                        </h3>
                        <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Full Name</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Email Address</label>
                                <input type="email" required className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">{editingUser ? "Password (leave blank to keep unchanged)" : "Password"}</label>
                                <input type="password" required={!editingUser} className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="Employee">Employee</option>
                                        <option value="Technician">Technician</option>
                                        <option value="IT Manager">IT Manager</option>
                                        <option value="Asset Manager">Asset Manager</option>
                                        <option value="System Admin">System Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Department</label>
                                    <select className="form-select" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                                        <option value="">None / General</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Phone Number</label>
                                <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
