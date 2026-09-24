import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Sparkles, AlertCircle } from "lucide-react";

export default function CreateTicketModal({ onClose, onSuccess }) {
    const { showToast } = useAuth();
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiReason, setAiReason] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        priority: "Medium",
        department: ""
    });

    useEffect(() => {
        // Fetch categories & departments
        Promise.all([
            fetch("/api/categories").then(r => r.json()),
            fetch("/api/departments").then(r => r.json())
        ]).then(([catData, deptData]) => {
            if (catData.success) setCategories(catData.categories || []);
            if (deptData.success) setDepartments(deptData.departments || []);
        }).catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAIClassify = async () => {
        if (!formData.title && !formData.description) {
            showToast("Please enter a title or description first", "info");
            return;
        }

        setAiLoading(true);
        try {
            const res = await fetch("/api/tickets/ai-classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: formData.title, description: formData.description })
            });
            const data = await res.json();
            if (data.success) {
                // Find matching category object ID if available
                const matchedCategory = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase());
                setFormData(prev => ({
                    ...prev,
                    category: matchedCategory ? matchedCategory._id : prev.category,
                    priority: data.priority || prev.priority
                }));
                setAiReason(`AI Auto-classified: Category '${data.category}', Priority '${data.priority}' (${data.probableIssue})`);
                showToast("AI Classification Applied!", "success");
            }
        } catch (err) {
            showToast("AI classification failed", "error");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to create ticket");
            }
            showToast("Ticket created successfully!", "success");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "620px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "800" }}>Create New IT Support Ticket</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label className="form-label">Ticket Title / Subject</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="form-input"
                            placeholder="e.g. Cannot connect to Office Wi-Fi"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label className="form-label">Detailed Description</label>
                            <button
                                type="button"
                                onClick={handleAIClassify}
                                disabled={aiLoading}
                                className="btn btn-secondary btn-sm"
                                style={{ color: "#a78bfa", borderColor: "rgba(139, 92, 246, 0.4)", marginBottom: "4px" }}
                            >
                                <Sparkles size={14} /> {aiLoading ? "Analyzing..." : "Auto-Classify with AI"}
                            </button>
                        </div>
                        <textarea
                            name="description"
                            required
                            rows={4}
                            className="form-textarea"
                            placeholder="Provide step-by-step details of the problem..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    {aiReason && (
                        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", fontSize: "0.8rem", color: "#c4b5fd", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Sparkles size={16} color="#a78bfa" />
                            {aiReason}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label className="form-label">Category</label>
                            <select
                                name="category"
                                className="form-select"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Priority Level</label>
                            <select
                                name="priority"
                                className="form-select"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Department</label>
                        <select
                            name="department"
                            className="form-select"
                            value={formData.department}
                            onChange={handleChange}
                        >
                            <option value="">Select Department (Optional)</option>
                            {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Submit Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
