// common.js - Centralized Design Primitives, Theme Tokens, and Reusable CSS Classes

export const theme = {
    colors: {
        bgPrimary: "#0f172a",
        bgSecondary: "#1e293b",
        bgCard: "rgba(30, 41, 59, 0.85)",
        bgGlass: "rgba(15, 23, 42, 0.75)",
        textPrimary: "#f8fafc",
        textSecondary: "#94a3b8",
        textMuted: "#64748b",
        accentPrimary: "#3b82f6",
        accentGradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        accentHover: "#2563eb",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#06b6d4",
        purple: "#8b5cf6",
        border: "rgba(255, 255, 255, 0.1)"
    },
    radii: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        full: "9999px"
    },
    shadows: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        glow: "0 0 20px rgba(59, 130, 246, 0.4)"
    }
};

export const statusColors = {
    "Open": { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" },
    "Assigned": { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.3)" },
    "In Progress": { bg: "rgba(6, 182, 212, 0.15)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.3)" },
    "Pending": { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
    "Resolved": { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" },
    "Closed": { bg: "rgba(100, 116, 139, 0.15)", text: "#94a3b8", border: "rgba(100, 116, 139, 0.3)" },
    "Reopened": { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" }
};

export const priorityColors = {
    "Low": { bg: "rgba(100, 116, 139, 0.15)", text: "#cbd5e1", badge: "#64748b" },
    "Medium": { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", badge: "#3b82f6" },
    "High": { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", badge: "#f59e0b" },
    "Critical": { bg: "rgba(239, 68, 68, 0.2)", text: "#f87171", badge: "#ef4444" }
};

// Global CSS stylesheet injector
export const injectGlobalStyles = () => {
    if (document.getElementById("servicedesk-global-styles")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "servicedesk-global-styles";
    styleEl.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${theme.colors.bgPrimary};
            color: ${theme.colors.textPrimary};
            min-height: 100vh;
            overflow-x: hidden;
            background-image: 
                radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.08) 0%, transparent 40%);
        }

        /* Glassmorphism Card */
        .glass-card {
            background: ${theme.colors.bgCard};
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid ${theme.colors.border};
            border-radius: ${theme.radii.lg};
            box-shadow: ${theme.shadows.md};
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
            border-color: rgba(255, 255, 255, 0.18);
            box-shadow: ${theme.shadows.lg};
        }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 18px;
            font-size: 0.9rem;
            font-weight: 600;
            border-radius: ${theme.radii.md};
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
        }

        .btn-primary {
            background: ${theme.colors.accentGradient};
            color: white;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
            opacity: 0.95;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: ${theme.colors.textPrimary};
            border: 1px solid ${theme.colors.border};
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.14);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-danger {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .btn-danger:hover {
            background: rgba(239, 68, 68, 0.35);
        }

        .btn-success {
            background: rgba(16, 185, 129, 0.2);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .btn-success:hover {
            background: rgba(16, 185, 129, 0.35);
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 0.8rem;
            border-radius: ${theme.radii.sm};
        }

        /* Inputs & Selects */
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 10px 14px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid ${theme.colors.border};
            border-radius: ${theme.radii.md};
            color: ${theme.colors.textPrimary};
            font-size: 0.9rem;
            font-family: inherit;
            outline: none;
            transition: all 0.2s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
            border-color: ${theme.colors.accentPrimary};
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
            background: rgba(15, 23, 42, 0.8);
        }

        .form-select option {
            background-color: ${theme.colors.bgSecondary};
            color: ${theme.colors.textPrimary};
        }

        .form-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: ${theme.colors.textSecondary};
            margin-bottom: 6px;
        }

        /* Table */
        .sd-table-container {
            width: 100%;
            overflow-x: auto;
            border-radius: ${theme.radii.md};
            border: 1px solid ${theme.colors.border};
        }

        .sd-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }

        .sd-table th {
            background: rgba(15, 23, 42, 0.8);
            color: ${theme.colors.textSecondary};
            font-weight: 600;
            padding: 14px 16px;
            border-bottom: 1px solid ${theme.colors.border};
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }

        .sd-table td {
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: ${theme.colors.textPrimary};
        }

        .sd-table tr:hover td {
            background: rgba(255, 255, 255, 0.03);
        }

        /* Badge */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: ${theme.radii.full};
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: capitalize;
            letter-spacing: 0.02em;
        }

        /* Modal Overlay */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
            background: ${theme.colors.bgSecondary};
            border: 1px solid ${theme.colors.border};
            border-radius: ${theme.radii.xl};
            width: 100%;
            max-width: 680px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 28px;
            box-shadow: ${theme.shadows.lg};
            animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    `;
    document.head.appendChild(styleEl);
};
