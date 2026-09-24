import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, Phone, Building2, Save } from "lucide-react";

export default function ProfileView() {
    const { user, showToast, checkAuth } = useAuth();
    const [phone, setPhone] = useState(user?.phone || "");
    const [name, setName] = useState(user?.name || "");
    const [saving, setSaving] = useState(false);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${user._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to update profile");
            
            showToast("Profile updated successfully", "success");
            checkAuth();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <div className="glass-card" style={{ padding: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "24px" }}>
                    <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.6rem",
                        fontWeight: "800"
                    }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#f8fafc" }}>{user?.name}</h2>
                        <span className="badge" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", marginTop: "4px" }}>
                            {user?.role}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                        <label className="form-label">Full Name</label>
                        <input type="text" required className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div>
                        <label className="form-label">Email Address (Read-only)</label>
                        <input type="email" disabled className="form-input" style={{ opacity: 0.6 }} value={user?.email || ""} />
                    </div>

                    <div>
                        <label className="form-label">Phone Number</label>
                        <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0192" />
                    </div>

                    <div>
                        <label className="form-label">Assigned Department</label>
                        <input type="text" disabled className="form-input" style={{ opacity: 0.6 }} value={user?.department?.name || "General / Enterprise"} />
                    </div>

                    <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: "10px" }}>
                        <Save size={18} /> {saving ? "Saving..." : "Save Profile Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}
