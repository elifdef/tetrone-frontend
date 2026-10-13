import React from 'react';

export function SvgIcon({ name, size = 18, strokeWidth = 1.6 }) {
    const common = {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
    };
    switch (name) {
        case "select": return (<svg {...common}><path d="M5 3l5.2 15.5 2.2-5.2 5.3 2.1L5 3z" /><path d="M13 14l5 5" /></svg>);
        case "transform": return (<svg {...common}><path d="M5 7V5h2" /><path d="M19 7V5h-2" /><path d="M5 17v2h2" /><path d="M19 17v2h-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>);
        case "crop": return (<svg {...common}><path d="M6 2v13a3 3 0 0 0 3 3h13" /><path d="M18 22V9a3 3 0 0 0-3-3H2" /></svg>);
        case "draw": return (<svg {...common}><path d="M4 20l4.5-1 10-10-3.5-3.5-10 10L4 20z" /><path d="M13.5 7.5l3.5 3.5" /><path d="M14 4l2 2" /></svg>);
        case "shapes": return (<svg {...common}><rect x="3" y="3" width="8" height="8" /><circle cx="17" cy="7" r="4" /><path d="M3 21h8l-4-7z" /><path d="M15 15h6v6h-6z" /></svg>);
        case "text": return (<svg {...common}><path d="M4 5h16" /><path d="M12 5v14" /><path d="M8 19h8" /></svg>);
        case "sticker": return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><circle cx="9" cy="9" r=".7" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r=".7" fill="currentColor" stroke="none" /></svg>);
        case "filter": return (<svg {...common}><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></svg>);
        case "undo": return (<svg {...common}><path d="M9 7L4 12l5 5" /><path d="M4 12h9a6 6 0 0 1 6 6v1" /></svg>);
        case "redo": return (<svg {...common}><path d="M15 7l5 5-5 5" /><path d="M20 12h-9a6 6 0 0 0-6 6v1" /></svg>);
        case "trash": return (<svg {...common}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M7 7l1 13h8l1-13" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>);
        case "compare": return (<svg {...common}><path d="M12 3v18" /><path d="M17 6h-5" /><path d="M17 18h-5" /><path d="M7 9h5" /><path d="M7 15h5" /></svg>);
        case "zoom-in": return (<svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /><path d="M10.5 7.5v6" /><path d="M7.5 10.5h6" /></svg>);
        case "zoom-out": return (<svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /><path d="M7.5 10.5h6" /></svg>);
        case "zoom-reset": return (<svg {...common}><path d="M5 9V5h4" /><path d="M19 15v4h-4" /><path d="M5 5l5 5" /><path d="M19 19l-5-5" /><path d="M15 5h4v4" /><path d="M5 19v-4h4" /></svg>);
        case "bold": return (<svg {...common}><path d="M8 5h5a3 3 0 0 1 0 6H8zm0 6h6a3.5 3.5 0 0 1 0 7H8z" strokeWidth="2.2" /></svg>);
        case "italic": return (<svg {...common}><path d="M10 5h8" /><path d="M6 19h8" /><path d="M14 5L10 19" /></svg>);
        case "underline": return (<svg {...common}><path d="M7 4v6a5 5 0 0 0 10 0V4" /><path d="M5 20h14" /></svg>);
        case "rotate-left": return (<svg {...common}><path d="M8 7H3V2" /><path d="M3 7a9 9 0 1 1 2.6 10.3" /></svg>);
        case "rotate-right": return (<svg {...common}><path d="M16 7h5V2" /><path d="M21 7a9 9 0 1 0-2.6 10.3" /></svg>);
        case "flip-h": return (<svg {...common}><path d="M12 4v16" /><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /></svg>);
        case "flip-v": return (<svg {...common}><path d="M4 12h16" /><path d="M8 8l4-4 4 4" /><path d="M8 16l4 4 4-4" /></svg>);
        case "copy": return (<svg {...common}><rect x="8" y="8" width="11" height="11" rx="1" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>);
        case "front": return (<svg {...common}><rect x="8" y="8" width="11" height="11" /><path d="M5 15H3V3h12v2" /><path d="M13 12l3-3" /><path d="M16 9h-3" /><path d="M16 9v3" /></svg>);
        case "back": return (<svg {...common}><rect x="5" y="5" width="11" height="11" /><path d="M19 9v10H9" /><path d="M11 15l-3 3" /><path d="M8 18h3" /><path d="M8 18v-3" /></svg>);
        case "center-h": return (<svg {...common}><path d="M12 3v18" /><rect x="7" y="8" width="10" height="8" /></svg>);
        case "center-v": return (<svg {...common}><path d="M3 12h18" /><rect x="8" y="7" width="8" height="10" /></svg>);
        case "shadow": return (<svg {...common}><rect x="5" y="5" width="10" height="10" /><path d="M9 9h10v10H9" /></svg>);
        case "check": return (<svg {...common}><path d="M5 12l4 4L19 6" /></svg>);
        case "close": return (<svg {...common}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>);

        // БАЗОВІ ФІГУРИ ТА ІНСТРУМЕНТИ
        case "square": return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>);
        case "circle": return (<svg {...common}><circle cx="12" cy="12" r="10" /></svg>);
        case "triangle": return (<svg {...common}><path d="M10.3 2.3a1.9 1.9 0 0 1 3.4 0l8 14a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3z" /></svg>);
        case "minus": return (<svg {...common}><path d="M5 12h14" /></svg>);
        case "arrow-right": return (<svg {...common}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>);
        case "sun": return (<svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M5 5l1.5 1.5" /><path d="M17.5 17.5L19 19" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M5 19l1.5-1.5" /><path d="M17.5 6.5L19 5" /></svg>);
        case "grid": return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>);
        case "edit": return (<svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>);

        // НОВІ ФІГУРИ
        case "ellipse": return (<svg {...common}><ellipse cx="12" cy="12" rx="10" ry="6" /></svg>);
        case "diamond": return (<svg {...common}><path d="M12 2l10 10-10 10L2 12 12 2z" /></svg>);
        case "hexagon": return (<svg {...common}><path d="M21 7.5V16.5L12 21L3 16.5V7.5L12 3L21 7.5Z" /></svg>);
        case "star": return (<svg {...common}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>);

        // ШАРИ ТА ПАПКИ
        case "folder": return (<svg {...common}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>);
        case "folder-plus": return (<svg {...common}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 11v6" /><path d="M9 14h6" /></svg>);
        case "eye": return (<svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
        case "eye-off": return (<svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></svg>);
        case "image": return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>);

        default: return null;
    }
}

export function SidebarButton({ active, label, icon, onClick, disabled = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={label}
            className={`w-full flex flex-col items-center justify-center gap-[6px] py-[12px] border-b border-border outline-none transition-colors cursor-pointer font-tahoma text-[10px] disabled:opacity-30 disabled:cursor-not-allowed ${
                active ? "bg-[rgba(91,155,213,0.11)] text-theme-link shadow-[inset_3px_0_0_var(--theme-link)]"
                    : "bg-transparent text-text-muted hover:bg-input-bg hover:text-text-main"
            }`}
        >
            {icon}
            <span className="text-center px-[2px] leading-tight break-words">{label}</span>
        </button>
    );
}

export function SmallButton({ children, onClick, active = false, disabled = false, title, danger = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`shrink-0 inline-flex items-center justify-center gap-[5px] h-[28px] px-[8px] border border-border outline-none font-tahoma text-[11px] cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                danger ? "text-theme-error hover:bg-[rgba(255,51,71,0.1)]"
                    : active ? "border-theme-link text-theme-link bg-[rgba(91,155,213,0.08)]"
                        : "bg-bg-page text-text-main hover:bg-input-bg"
            }`}
        >
            {children}
        </button>
    );
}

export function PropertyLabel({ children }) {
    return <span className="text-[10px] text-text-muted whitespace-nowrap">{children}</span>;
}