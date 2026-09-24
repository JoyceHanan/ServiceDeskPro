import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Search, BookOpen, Eye, Plus, Tag, User, Calendar, X } from "lucide-react";

export default function KnowledgeView() {
    const { user, showToast } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "General",
        tags: "",
        status: "Published"
    });

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const res = await fetch(`/api/knowledge?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setArticles(data.articles || []);
            }
        } catch (err) {
            console.error("Failed to load knowledge articles:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const openArticleReader = async (id) => {
        try {
            const res = await fetch(`/api/knowledge/${id}`);
            const data = await res.json();
            if (data.success && data.article) {
                setSelectedArticle(data.article);
            }
        } catch (err) {}
    };

    const handleCreateArticle = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/knowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to create article");
            }
            showToast("Article published successfully!", "success");
            setShowCreateModal(false);
            setFormData({ title: "", content: "", category: "General", tags: "", status: "Published" });
            fetchArticles();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const isStaff = ["Technician", "IT Manager", "System Admin"].includes(user?.role);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Search Toolbar */}
            <div className="glass-card" style={{ padding: "20px", display: "flex", gap: "14px", justifyContent: "space-between", alignItems: "center" }}>
                <form onSubmit={(e) => { e.preventDefault(); fetchArticles(); }} style={{ display: "flex", gap: "12px", flex: 1, maxWidth: "600px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: "38px" }}
                            placeholder="Search help articles by topic, keyword, or tag..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">Search</button>
                </form>

                {isStaff && (
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <Plus size={18} /> New KB Article
                    </button>
                )}
            </div>

            {/* Articles Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px"
            }}>
                {loading ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#94a3b8", padding: "40px" }}>
                        Loading Knowledge Base articles...
                    </div>
                ) : articles.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "40px" }}>
                        No knowledge articles found.
                    </div>
                ) : (
                    articles.map(art => (
                        <div
                            key={art._id}
                            className="glass-card"
                            style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer" }}
                            onClick={() => openArticleReader(art._id)}
                        >
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                                        {art.category}
                                    </span>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Eye size={14} /> {art.views} views
                                    </span>
                                </div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#f8fafc", marginBottom: "8px" }}>
                                    {art.title}
                                </h3>
                                <p style={{
                                    fontSize: "0.85rem",
                                    color: "#94a3b8",
                                    lineHeight: "1.5",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                }}>
                                    {art.content}
                                </p>
                            </div>

                            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                                <span>Author: {art.author?.name || "IT Team"}</span>
                                <span>{new Date(art.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Article Detail Reader Modal */}
            {selectedArticle && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "720px", padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <div>
                                <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", marginBottom: "8px" }}>
                                    {selectedArticle.category}
                                </span>
                                <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#f8fafc" }}>{selectedArticle.title}</h2>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px", display: "flex", gap: "14px" }}>
                                    <span>Author: {selectedArticle.author?.name}</span>
                                    <span>Views: {selectedArticle.views}</span>
                                    <span>Published: {new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedArticle(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.95rem", color: "#f8fafc", lineHeight: "1.7", whiteSpace: "pre-wrap", margin: "16px 0" }}>
                            {selectedArticle.content}
                        </div>

                        {selectedArticle.tags?.length > 0 && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
                                {selectedArticle.tags.map((tag, idx) => (
                                    <span key={idx} className="badge" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd" }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create KB Article Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>Create Knowledge Base Article</h3>
                        <form onSubmit={handleCreateArticle} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="form-label">Article Title</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g. How to configure corporate VPN"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Category</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Network, Software, Account Access"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="vpn, remote, network, credentials"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Article Content</label>
                                <textarea
                                    required
                                    rows={6}
                                    className="form-textarea"
                                    placeholder="Write clear, step-by-step instructions..."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Publish Article</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
