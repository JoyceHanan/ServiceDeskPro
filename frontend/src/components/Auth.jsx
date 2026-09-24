import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Mail, Lock, User, Phone, Building2, UserCheck, ArrowRight } from "lucide-react";

export default function Auth() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "Employee",
        department: "",
        phone: ""
    });

    useEffect(() => {
        // Fetch departments for registration selection
        fetch("/api/departments")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.departments) {
                    setDepartments(data.departments);
                }
            })
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData);
            }
        } catch (err) {
            // Error is handled in context toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "460px", padding: "36px" }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px",
                        boxShadow: "0 8px 24px rgba(59, 130, 246, 0.4)"
                    }}>
                        <ShieldCheck size={32} color="#ffffff" />
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", letterSpacing: "-0.02em" }}>ServiceDesk Pro</h1>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "6px" }}>
                        IT Helpdesk & Enterprise Asset Management
                    </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                    display: "flex",
                    background: "rgba(15, 23, 42, 0.6)",
                    borderRadius: "10px",
                    padding: "4px",
                    marginBottom: "24px"
                }}>
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        style={{
                            flex: 1,
                            padding: "10px",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            background: isLogin ? "#3b82f6" : "transparent",
                            color: isLogin ? "#ffffff" : "#94a3b8",
                            transition: "all 0.2s"
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        style={{
                            flex: 1,
                            padding: "10px",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            background: !isLogin ? "#3b82f6" : "transparent",
                            color: !isLogin ? "#ffffff" : "#94a3b8",
                            transition: "all 0.2s"
                        }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {!isLogin && (
                        <div>
                            <label className="form-label">Full Name</label>
                            <div style={{ position: "relative" }}>
                                <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="form-input"
                                    style={{ paddingLeft: "38px" }}
                                    placeholder="Jane Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="form-label">Email Address</label>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                            <input
                                type="email"
                                name="email"
                                required
                                className="form-input"
                                style={{ paddingLeft: "38px" }}
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Password</label>
                        <div style={{ position: "relative" }}>
                            <Lock size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                            <input
                                type="password"
                                name="password"
                                required
                                className="form-input"
                                style={{ paddingLeft: "38px" }}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="form-label">Role</label>
                                <div style={{ position: "relative" }}>
                                    <UserCheck size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                                    <select
                                        name="role"
                                        className="form-select"
                                        style={{ paddingLeft: "38px" }}
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="Employee">Employee (End User)</option>
                                        <option value="Technician">IT Technician</option>
                                        <option value="IT Manager">IT Manager</option>
                                        <option value="Asset Manager">Asset Manager</option>
                                        <option value="System Admin">System Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Department</label>
                                <div style={{ position: "relative" }}>
                                    <Building2 size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                                    <select
                                        name="department"
                                        className="form-select"
                                        style={{ paddingLeft: "38px" }}
                                        value={formData.department}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Department (Optional)</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Phone Number</label>
                                <div style={{ position: "relative" }}>
                                    <Phone size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                                    <input
                                        type="text"
                                        name="phone"
                                        className="form-input"
                                        style={{ paddingLeft: "38px" }}
                                        placeholder="+1 555 0192"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "0.95rem" }}
                    >
                        {loading ? "Processing..." : (isLogin ? "Sign In to ServiceDesk" : "Create Account")}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                    Secured by JWT & HTTP-only Cookie Authentication
                </div>
            </div>
        </div>
    );
}
