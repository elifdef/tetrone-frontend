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